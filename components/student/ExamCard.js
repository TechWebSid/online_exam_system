import { FiClock, FiCalendar, FiBook, FiAward, FiCheckCircle } from 'react-icons/fi';

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
        <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-100 overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110" />
            
            {/* Card Header */}
            <div className="relative">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {exam.title}
                </h3>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4" />
            </div>

            {/* Card Content */}
            <div className="space-y-3 text-sm text-gray-600 mb-6 relative">
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiBook className="w-5 h-5 text-blue-500" />
                    <p><span className="font-medium">Subject:</span> {exam.subject.name}</p>
                </div>

                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiClock className="w-5 h-5 text-indigo-500" />
                    <p><span className="font-medium">Duration:</span> {exam.duration} minutes</p>
                </div>

                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiAward className="w-5 h-5 text-purple-500" />
                    <p><span className="font-medium">Total Marks:</span> {exam.totalMarks}</p>
                </div>

                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                    <p><span className="font-medium">Passing Marks:</span> {exam.passingMarks}</p>
                </div>

                <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <FiCalendar className="w-5 h-5 text-rose-500 mt-1" />
                    <div>
                        <p className="font-medium mb-1">Available:</p>
                        <p className="text-gray-500">From: {formatDate(exam.startDate)}</p>
                        <p className="text-gray-500">To: {formatDate(exam.endDate)}</p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={onStart}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg 
                         font-medium hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 
                         transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 
                         focus:outline-none active:scale-[0.98] shadow-sm"
            >
                Start Exam
            </button>
        </div>
    );
} 