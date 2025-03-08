import { connectDB } from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

// GET /api/student/exams - Get all available exams for students
export async function GET() {
    try {
        await connectDB();
        
        const currentDate = new Date();
        
        // Get only active exams that are currently available
        const exams = await Exam.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        })
        .populate('subject')
        .populate('questions')
        .sort({ startDate: 1 });

        return NextResponse.json({
            success: true,
            data: exams
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch exams'
            },
            { status: 500 }
        );
    }
}

// POST /api/student/exams/:examId/submit - Submit exam answers
export async function POST(request, { params }) {
    try {
        await connectDB();
        const { examId } = params;
        const { answers } = await request.json();

        const exam = await Exam.findById(examId)
            .populate('subject')
            .populate('questions');

        if (!exam) {
            return NextResponse.json(
                { 
                    success: false,
                    message: 'Exam not found'
                },
                { status: 404 }
            );
        }

        // Calculate results
        let obtainedMarks = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        const questionResults = exam.questions.map(question => {
            const answer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = answer && question.options[answer.selectedOption].isCorrect;
            
            if (isCorrect) {
                obtainedMarks += question.marks;
                correctAnswers++;
            } else if (answer) {
                incorrectAnswers++;
            }

            return {
                ...question.toObject(),
                selectedOption: answer ? answer.selectedOption : null,
                isCorrect: isCorrect
            };
        });

        const result = {
            exam,
            obtainedMarks,
            totalQuestions: exam.questions.length,
            attemptedQuestions: answers.length,
            correctAnswers,
            incorrectAnswers,
            questions: questionResults
        };

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to submit exam'
            },
            { status: 500 }
        );
    }
} 