export default function ExamResult({ result, onClose }) {
    const calculatePercentage = (obtained, total) => {
        return Math.round((obtained / total) * 100);
    };

    const getResultStatus = () => {
        if (result.obtainedMarks >= result.exam.passingMarks) {
            return {
                text: 'PASSED',
                color: 'text-green-600',
                bg: 'bg-green-100'
            };
        }
        return {
            text: 'FAILED',
            color: 'text-red-600',
            bg: 'bg-red-100'
        };
    };

    const status = getResultStatus();

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Exam Results</h2>
                <p className="text-gray-600">{result.exam.title}</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${status.bg}`}>
                    <span className={`text-lg font-semibold ${status.color}`}>
                        {status.text}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Score Summary</h3>
                    <div className="space-y-2">
                        <p className="flex justify-between">
                            <span className="text-gray-600">Total Marks:</span>
                            <span className="font-medium">{result.exam.totalMarks}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600">Obtained Marks:</span>
                            <span className="font-medium">{result.obtainedMarks}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600">Passing Marks:</span>
                            <span className="font-medium">{result.exam.passingMarks}</span>
                        </p>
                        <p className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Percentage:</span>
                            <span className="font-medium">
                                {calculatePercentage(result.obtainedMarks, result.exam.totalMarks)}%
                            </span>
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Question Summary</h3>
                    <div className="space-y-2">
                        <p className="flex justify-between">
                            <span className="text-gray-600">Total Questions:</span>
                            <span className="font-medium">{result.totalQuestions}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600">Attempted:</span>
                            <span className="font-medium">{result.attemptedQuestions}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600">Correct:</span>
                            <span className="font-medium text-green-600">{result.correctAnswers}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600">Incorrect:</span>
                            <span className="font-medium text-red-600">{result.incorrectAnswers}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Question Review */}
            <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Question Review</h3>
                <div className="space-y-6">
                    {result.questions.map((question, index) => (
                        <div key={question._id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-gray-900 font-medium">Question {index + 1}</h4>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {question.isCorrect ? '+' : '-'}{question.marks} marks
                                </span>
                            </div>
                            <p className="text-gray-800 mb-3">{question.text}</p>
                            <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                    <div
                                        key={optIndex}
                                        className={`p-2 rounded ${
                                            option.isCorrect
                                                ? 'bg-green-100 text-green-800'
                                                : question.selectedOption === optIndex
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-white text-gray-600'
                                        }`}
                                    >
                                        {option.text}
                                        {option.isCorrect && ' ✓'}
                                    </div>
                                ))}
                            </div>
                            {question.explanation && (
                                <div className="mt-3 text-sm text-gray-600">
                                    <span className="font-medium">Explanation:</span> {question.explanation}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
} 