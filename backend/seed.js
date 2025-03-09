const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const Subject = require('./models/Subject');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exam-system')
    .then(() => console.log('MongoDB connected for seeding...'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Seed data
const seedDatabase = async () => {
    try {
        // Clear existing data
        await Subject.deleteMany({});
        await Question.deleteMany({});
        await Exam.deleteMany({});
        
        console.log('Previous data cleared');

        // Create admin user first or find existing one
        let adminUser;
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            adminUser = await User.create({
                fullName: 'Admin User',
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            
            console.log('Admin user created:', adminUser.fullName);
        } else {
            adminUser = existingAdmin;
            console.log('Using existing admin user');
        }

        // Create subjects
        const subjects = await Subject.insertMany([
            { name: 'Database Management Systems', code: 'DBMS', description: 'Study of database design, implementation, and management' },
            { name: 'Operating Systems', code: 'OS', description: 'Study of operating system concepts, processes, and scheduling' },
            { name: 'Java Programming', code: 'JAVA', description: 'Object-oriented programming with Java' },
            { name: 'Computer Networks', code: 'NET', description: 'Study of network protocols, architecture, and security' }
        ]);

        console.log('Subjects created:', subjects.map(s => s.name));

        // Create DBMS questions
        const dbmsQuestions = await Question.insertMany([
            {
                text: 'Which of the following is not a type of database?',
                options: [
                    { text: 'Hierarchical', isCorrect: false },
                    { text: 'Network', isCorrect: false },
                    { text: 'Algorithmic', isCorrect: true },
                    { text: 'Relational', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[0]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What does ACID stand for in database transactions?',
                options: [
                    { text: 'Atomicity, Consistency, Isolation, Durability', isCorrect: true },
                    { text: 'Atomicity, Concurrency, Isolation, Durability', isCorrect: false },
                    { text: 'Aggregation, Consistency, Isolation, Durability', isCorrect: false },
                    { text: 'Atomicity, Consistency, Inheritance, Durability', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[0]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which normal form deals with removing transitive dependencies?',
                options: [
                    { text: 'First Normal Form (1NF)', isCorrect: false },
                    { text: 'Second Normal Form (2NF)', isCorrect: false },
                    { text: 'Third Normal Form (3NF)', isCorrect: true },
                    { text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[0]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which of the following is not a valid SQL command?',
                options: [
                    { text: 'SELECT', isCorrect: false },
                    { text: 'MODIFY', isCorrect: true },
                    { text: 'INSERT', isCorrect: false },
                    { text: 'DELETE', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[0]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is a foreign key?',
                options: [
                    { text: 'A key that can open any lock', isCorrect: false },
                    { text: 'A key that uniquely identifies each record in a table', isCorrect: false },
                    { text: 'A key used to link two tables together', isCorrect: true },
                    { text: 'A key that is not native to the database system', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[0]._id,
                createdBy: adminUser._id
            }
        ]);

        // Create OS questions
        const osQuestions = await Question.insertMany([
            {
                text: 'Which scheduling algorithm is most appropriate for time-sharing systems?',
                options: [
                    { text: 'First-Come, First-Served (FCFS)', isCorrect: false },
                    { text: 'Shortest Job First (SJF)', isCorrect: false },
                    { text: 'Round Robin (RR)', isCorrect: true },
                    { text: 'Priority Scheduling', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[1]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is thrashing in an operating system?',
                options: [
                    { text: 'A type of computer virus', isCorrect: false },
                    { text: 'Excessive paging, leading to performance degradation', isCorrect: true },
                    { text: 'A method of disk defragmentation', isCorrect: false },
                    { text: 'A technique to optimize CPU usage', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[1]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which of the following is not a process state?',
                options: [
                    { text: 'Ready', isCorrect: false },
                    { text: 'Running', isCorrect: false },
                    { text: 'Blocked', isCorrect: false },
                    { text: 'Compiling', isCorrect: true }
                ],
                marks: 2,
                subject: subjects[1]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is a deadlock in an operating system?',
                options: [
                    { text: 'A situation where two or more processes are unable to proceed because each is waiting for resources held by the other', isCorrect: true },
                    { text: 'A situation where a process is waiting for a resource that will never be available', isCorrect: false },
                    { text: 'A situation where the CPU is idle but there are processes in the ready queue', isCorrect: false },
                    { text: 'A situation where a process is using 100% of the CPU time', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[1]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which memory allocation strategy is most likely to suffer from external fragmentation?',
                options: [
                    { text: 'First Fit', isCorrect: false },
                    { text: 'Best Fit', isCorrect: false },
                    { text: 'Worst Fit', isCorrect: false },
                    { text: 'All of the above', isCorrect: true }
                ],
                marks: 2,
                subject: subjects[1]._id,
                createdBy: adminUser._id
            }
        ]);

        // Create Java questions
        const javaQuestions = await Question.insertMany([
            {
                text: 'Which of the following is not a feature of Java?',
                options: [
                    { text: 'Platform Independence', isCorrect: false },
                    { text: 'Pointers', isCorrect: true },
                    { text: 'Garbage Collection', isCorrect: false },
                    { text: 'Object-Oriented', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[2]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is the output of System.out.println(5 + 7 + "Java")?',
                options: [
                    { text: '12Java', isCorrect: true },
                    { text: '5 + 7 + Java', isCorrect: false },
                    { text: '57Java', isCorrect: false },
                    { text: 'Java57', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[2]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which keyword is used to inherit a class in Java?',
                options: [
                    { text: 'implements', isCorrect: false },
                    { text: 'extends', isCorrect: true },
                    { text: 'inherits', isCorrect: false },
                    { text: 'using', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[2]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is the difference between == and equals() in Java?',
                options: [
                    { text: 'There is no difference', isCorrect: false },
                    { text: '== compares references while equals() compares contents', isCorrect: true },
                    { text: '== compares contents while equals() compares references', isCorrect: false },
                    { text: 'equals() is faster than ==', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[2]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which of the following is not a valid access modifier in Java?',
                options: [
                    { text: 'public', isCorrect: false },
                    { text: 'private', isCorrect: false },
                    { text: 'protected', isCorrect: false },
                    { text: 'friend', isCorrect: true }
                ],
                marks: 2,
                subject: subjects[2]._id,
                createdBy: adminUser._id
            }
        ]);

        // Create Networking questions
        const networkingQuestions = await Question.insertMany([
            {
                text: 'Which layer of the OSI model is responsible for routing?',
                options: [
                    { text: 'Data Link Layer', isCorrect: false },
                    { text: 'Network Layer', isCorrect: true },
                    { text: 'Transport Layer', isCorrect: false },
                    { text: 'Session Layer', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[3]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is the maximum number of IP addresses possible in a /24 network?',
                options: [
                    { text: '254', isCorrect: true },
                    { text: '256', isCorrect: false },
                    { text: '128', isCorrect: false },
                    { text: '512', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[3]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which protocol is used for secure web browsing?',
                options: [
                    { text: 'HTTP', isCorrect: false },
                    { text: 'FTP', isCorrect: false },
                    { text: 'HTTPS', isCorrect: true },
                    { text: 'SMTP', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[3]._id,
                createdBy: adminUser._id
            },
            {
                text: 'What is the purpose of DNS?',
                options: [
                    { text: 'To assign IP addresses to devices', isCorrect: false },
                    { text: 'To translate domain names to IP addresses', isCorrect: true },
                    { text: 'To encrypt network traffic', isCorrect: false },
                    { text: 'To route packets across networks', isCorrect: false }
                ],
                marks: 2,
                subject: subjects[3]._id,
                createdBy: adminUser._id
            },
            {
                text: 'Which of the following is not a valid TCP/IP layer?',
                options: [
                    { text: 'Application Layer', isCorrect: false },
                    { text: 'Internet Layer', isCorrect: false },
                    { text: 'Network Access Layer', isCorrect: false },
                    { text: 'Session Layer', isCorrect: true }
                ],
                marks: 2,
                subject: subjects[3]._id,
                createdBy: adminUser._id
            }
        ]);

        // Create exams
        const exams = await Exam.insertMany([
            {
                title: 'DBMS Exam',
                description: 'Database Management System MCQs',
                subject: subjects[0]._id,
                questions: dbmsQuestions.map(q => q._id),
                duration: 15, // 15 minutes
                totalMarks: dbmsQuestions.reduce((total, q) => total + q.marks, 0),
                startDate: new Date(), // Start from today
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End 30 days from now
                isActive: true,
                difficulty: 'Intermediate',
                createdBy: adminUser._id,
                instructions: 'Read all questions carefully. Each question has only one correct answer. No negative marking.',
                passingMarks: 6,
                attemptLimit: 1
            },
            {
                title: 'Operating System Exam',
                description: 'OS Concepts & Scheduling Questions',
                subject: subjects[1]._id,
                questions: osQuestions.map(q => q._id),
                duration: 15, // 15 minutes
                totalMarks: osQuestions.reduce((total, q) => total + q.marks, 0),
                startDate: new Date(), // Start from today
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End 30 days from now
                isActive: true,
                difficulty: 'Advanced',
                createdBy: adminUser._id,
                instructions: 'Read all questions carefully. Each question has only one correct answer. No negative marking.',
                passingMarks: 6,
                attemptLimit: 1
            },
            {
                title: 'Java Exam',
                description: 'OOPs, Threads, and Core Java MCQs',
                subject: subjects[2]._id,
                questions: javaQuestions.map(q => q._id),
                duration: 15, // 15 minutes
                totalMarks: javaQuestions.reduce((total, q) => total + q.marks, 0),
                startDate: new Date(), // Start from today
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End 30 days from now
                isActive: true,
                difficulty: 'Expert',
                createdBy: adminUser._id,
                instructions: 'Read all questions carefully. Each question has only one correct answer. No negative marking.',
                passingMarks: 6,
                attemptLimit: 1
            },
            {
                title: 'Networking Exam',
                description: 'TCP/IP, OSI Model, Protocols & Security',
                subject: subjects[3]._id,
                questions: networkingQuestions.map(q => q._id),
                duration: 15, // 15 minutes
                totalMarks: networkingQuestions.reduce((total, q) => total + q.marks, 0),
                startDate: new Date(), // Start from today
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End 30 days from now
                isActive: true,
                difficulty: 'Intermediate',
                createdBy: adminUser._id,
                instructions: 'Read all questions carefully. Each question has only one correct answer. No negative marking.',
                passingMarks: 6,
                attemptLimit: 1
            }
        ]);

        console.log('Exams created:', exams.map(e => e.title));

        // Create a test student user if it doesn't exist
        let student;
        const existingUser = await User.findOne({ email: 'student@example.com' });
        
        if (!existingUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            student = await User.create({
                fullName: 'Test Student',
                username: 'student',
                email: 'student@example.com',
                password: hashedPassword,
                role: 'student',
                faceAuthStatus: {
                    isRegistered: false
                }
            });
            
            console.log('Test student created:', student.fullName);
        } else {
            student = existingUser;
            console.log('Test student already exists');
        }

        // Create exam results for the test student
        // First, clear any existing exam results
        const ExamResult = require('./models/ExamResult');
        await ExamResult.deleteMany({ student: student._id });
        
        // Create exam results for each exam
        const examResults = [];
        
        // DBMS Exam - Passed with good score
        const dbmsResult = await ExamResult.create({
            student: student._id,
            exam: exams[0]._id,
            answers: [
                {
                    questionId: dbmsQuestions[0]._id,
                    selectedOption: 2, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: dbmsQuestions[1]._id,
                    selectedOption: 0, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: dbmsQuestions[2]._id,
                    selectedOption: 2, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: dbmsQuestions[3]._id,
                    selectedOption: 1, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: dbmsQuestions[4]._id,
                    selectedOption: 2, // Correct answer
                    isCorrect: true
                }
            ],
            obtainedMarks: 10, // All correct
            totalQuestions: 5,
            attemptedQuestions: 5,
            correctAnswers: 5,
            incorrectAnswers: 0,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });
        examResults.push(dbmsResult);
        
        // OS Exam - Failed
        const osResult = await ExamResult.create({
            student: student._id,
            exam: exams[1]._id,
            answers: [
                {
                    questionId: osQuestions[0]._id,
                    selectedOption: 2, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: osQuestions[1]._id,
                    selectedOption: 0, // Incorrect answer
                    isCorrect: false
                },
                {
                    questionId: osQuestions[2]._id,
                    selectedOption: 1, // Incorrect answer
                    isCorrect: false
                },
                {
                    questionId: osQuestions[3]._id,
                    selectedOption: 0, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: osQuestions[4]._id,
                    selectedOption: 2, // Incorrect answer
                    isCorrect: false
                }
            ],
            obtainedMarks: 4, // 2 correct answers * 2 marks each
            totalQuestions: 5,
            attemptedQuestions: 5,
            correctAnswers: 2,
            incorrectAnswers: 3,
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        });
        examResults.push(osResult);
        
        // Java Exam - Passed with average score
        const javaResult = await ExamResult.create({
            student: student._id,
            exam: exams[2]._id,
            answers: [
                {
                    questionId: javaQuestions[0]._id,
                    selectedOption: 1, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: javaQuestions[1]._id,
                    selectedOption: 0, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: javaQuestions[2]._id,
                    selectedOption: 1, // Correct answer
                    isCorrect: true
                },
                {
                    questionId: javaQuestions[3]._id,
                    selectedOption: 0, // Incorrect answer
                    isCorrect: false
                },
                {
                    questionId: javaQuestions[4]._id,
                    selectedOption: 3, // Correct answer
                    isCorrect: true
                }
            ],
            obtainedMarks: 8, // 4 correct answers * 2 marks each
            totalQuestions: 5,
            attemptedQuestions: 5,
            correctAnswers: 4,
            incorrectAnswers: 1,
            submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        });
        examResults.push(javaResult);

        console.log('Exam results created for test student:', examResults.length);
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase(); 