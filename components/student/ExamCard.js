export default function ExamCard({ exam, onStart }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium">Subject:</span> {exam.subject.name}</p>
                <p><span className="font-medium">Duration:</span> {exam.duration} minutes</p>
                <p><span className="font-medium">Total Marks:</span> {exam.totalMarks}</p>
                <p><span className="font-medium">Passing Marks:</span> {exam.passingMarks}</p>
                <p>
                    <span className="font-medium">Available:</span><br />
                    From: {formatDate(exam.startDate)}<br />
                    To: {formatDate(exam.endDate)}
                </p>
            </div>
            <button
                onClick={onStart}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
                Start Exam
            </button>
        </div>
    );
} 