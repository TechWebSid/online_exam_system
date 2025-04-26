import { connectDB } from '@/lib/db';
import Exam from '@/models/Exam';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get request body
        const body = await req.json();
        const { examId, reason } = body;

        if (!examId) {
            return new Response(JSON.stringify({ success: false, message: 'Exam ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Connect to database
        await connectDB();

        // Find and update exam status
        const exam = await Exam.findOneAndUpdate(
            {
                _id: examId,
                student: session.user.id,
                status: 'in-progress'
            },
            {
                status: 'cancelled',
                cancellationReason: reason || 'Tab switch violation',
                cancelledAt: new Date()
            },
            { new: true }
        );

        if (!exam) {
            return new Response(JSON.stringify({ success: false, message: 'Exam not found or already completed' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, message: 'Exam cancelled successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error cancelling exam:', error);
        return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 