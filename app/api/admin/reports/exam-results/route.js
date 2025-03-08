import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamResult from '@/models/ExamResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await dbConnect();

        const results = await ExamResult.find()
            .populate('student', 'fullName username email')
            .populate({
                path: 'exam',
                populate: {
                    path: 'subject',
                    select: 'name'
                }
            })
            .sort('-submittedAt');

        return NextResponse.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching exam results:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch exam results' }, { status: 500 });
    }
} 