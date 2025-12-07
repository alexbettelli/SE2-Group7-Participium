import { useNavigate } from 'react-router';
import '../styles/HelpCenter.css';

export default function HelpCenter({ user }) {
    const navigate = useNavigate();

    const faqItems = [
        {
            question: "How do I submit a report?",
            answer: "Click on the map to select a location inside Turin. Fill in the report details including title, description, category, and upload 1-3 photos. Make sure the location is within the city boundaries."
        },
        {
            question: "What happens after I submit a report?",
            answer: "Your report will be reviewed by municipal staff. If approved, it will be assigned to the appropriate office. You'll receive notifications about status updates and can communicate with staff through the chat feature."
        },
        {
            question: "Can I submit reports anonymously?",
            answer: "Yes, you can choose to submit reports anonymously. Your name won't be visible in public reports, but the system still tracks your submissions for internal purposes."
        },
        {
            question: "How do I track my reports?",
            answer: "Go to 'My Reports' from the navigation menu. You'll see all your submitted reports with their current status. Click on any report to see details and chat with staff."
        },
        {
            question: "What categories can I report?",
            answer: "You can report issues related to roads, waste management, green areas, public transport, lighting, and other municipal services. Select the appropriate category when submitting your report."
        },
        {
            question: "How do I view reports on the map?",
            answer: "The map shows all approved reports. Zoom out to see clusters of reports, or zoom in to see individual markers. Click on markers to view report details."
        }
    ];

    const gettingStarted = [
        {
            title: "Create an account",
            description: "Register with your email and personal information to start reporting issues in Turin."
        },
        {
            title: "Select a location",
            description: "Click on the map to choose where the issue is located. Make sure it's within Turin city boundaries."
        },
        {
            title: "Fill in details",
            description: "Provide a clear title, detailed description, and select the appropriate category for your report."
        },
        {
            title: "Upload photos",
            description: "Add 1 to 3 photos showing the issue. Clear photos help municipal staff understand the problem better."
        },
        {
            title: "Submit your report",
            description: "Review your information and submit. Your report will be sent for review by municipal staff."
        },
        {
            title: "Track progress",
            description: "Monitor your report's status through 'My Reports'. You'll receive notifications about updates and can chat with staff."
        }
    ];

    return (
        <div className="help-center-container">
            <div className="help-center-header">
                <button className="help-back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Back
                </button>
                <h1>Help Center</h1>
                <p className="help-center-subtitle">Get help using Participium</p>
            </div>

            <div className="help-center-content">
                <section className="help-section">
                    <h2>Getting Started</h2>
                    <div className="getting-started-grid">
                        {gettingStarted.map((item, index) => (
                            <div key={index} className="getting-started-card">
                                <div className="getting-started-number">{index + 1}</div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="help-section">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-list">
                        {faqItems.map((item, index) => (
                            <div key={index} className="faq-item">
                                <h3 className="faq-question">{item.question}</h3>
                                <p className="faq-answer">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="help-section">
                    <h2>Need More Help?</h2>
                    <p>If you can't find what you're looking for, please contact the municipal office directly.</p>
                </section>
            </div>
        </div>
    );
}

