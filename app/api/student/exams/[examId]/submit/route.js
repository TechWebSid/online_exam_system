import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamResult from '@/models/ExamResult';
import Exam from '@/models/Exam';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'student') {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await dbConnect();
        const { examId } = params;
        const { answers } = await req.json();

        const exam = await Exam.findById(examId)
            .populate('subject')
            .populate('questions');

        if (!exam) {
            return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
        }

        // Calculate results
        let obtainedMarks = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        const processedAnswers = exam.questions.map(question => {
            const answer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = answer && question.options[answer.selectedOption].isCorrect;
            
            if (isCorrect) {
                obtainedMarks += question.marks;
                correctAnswers++;
            } else if (answer) {
                incorrectAnswers++;
            }

            return answer ? {
                questionId: question._id,
                selectedOption: answer.selectedOption,
                isCorrect
            } : null;
        }).filter(Boolean);

        // Save exam result
        const examResult = await ExamResult.create({
            student: session.user.id,
            exam: examId,
            answers: processedAnswers,
            obtainedMarks,
            totalQuestions: exam.questions.length,
            attemptedQuestions: answers.length,
            correctAnswers,
            incorrectAnswers
        });

        // Populate the result with exam and student details
        await examResult.populate('exam');
        await examResult.populate('student', 'fullName username email');

        const result = {
            exam,
            obtainedMarks,
            totalQuestions: exam.questions.length,
            attemptedQuestions: answers.length,
            correctAnswers,
            incorrectAnswers,
            questions: exam.questions.map(question => {
                const answer = answers.find(a => a.questionId === question._id.toString());
                const isCorrect = answer && question.options[answer.selectedOption].isCorrect;
                
                return {
                    ...question.toObject(),
                    selectedOption: answer ? answer.selectedOption : null,
                    isCorrect
                };
            })
        };

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        return NextResponse.json({ success: false, message: 'Failed to submit exam' }, { status: 500 });
    }
} 