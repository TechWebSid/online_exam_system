import { connectDB } from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

// GET /api/admin/exams
export async function GET() {
    try {
        await connectDB();
        const exams = await Exam.find({})
            .populate('subject')
            .populate('questions')
            .sort({ createdAt: -1 });

        return NextResponse.json(exams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exams' },
            { status: 500 }
        );
    }
}

// POST /api/admin/exams
export async function POST(request) {
    try {
        const examData = await request.json();
        await connectDB();

        const exam = await Exam.create(examData);
        await exam.populate('subject');
        await exam.populate('questions');

        return NextResponse.json(exam);
    } catch (error) {
        console.error('Error creating exam:', error);
        return NextResponse.json(
            { error: 'Failed to create exam' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/exams
export async function PUT(request) {
    try {
        const { id, ...updateData } = await request.json();
        await connectDB();

        const exam = await Exam.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('subject').populate('questions');

        if (!exam) {
            return NextResponse.json(
                { error: 'Exam not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error('Error updating exam:', error);
        return NextResponse.json(
            { error: 'Failed to update exam' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/exams
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        await connectDB();
        const exam = await Exam.findByIdAndDelete(id);

        if (!exam) {
            return NextResponse.json(
                { error: 'Exam not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        return NextResponse.json(
            { error: 'Failed to delete exam' },
            { status: 500 }
        );
    }
} 