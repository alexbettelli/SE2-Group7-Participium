import { useRef, useEffect, useState } from "react";
import '../styles/ChatPage.css';
import Message from "./Message.jsx";

export default function ChatPage(props){
    const { report, user } = props;
    const [messages, setMessages] = useState(report.notifications);
    const [officerUsername, setOfficerUsername] = useState(null);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [notificationText, setNotificationText] = useState("");
    const [sending, setSending] = useState(false);
    const chatScrollRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (report?.id) {
            setMessages(report.notifications);
        }
    }, [report, user.id]);

    useEffect(() => {
        if (!loading && chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [loading]);

    const handleSendNotification = async () => {
        if (!notificationText.trim()) return;
        setSending(true);
        try {
            const newMessage = await API.submitNotification({
                reportId: report.id,
                senderId: report.employee.id || 1, 
                receiverId: report.user.id, 
                text: notificationText,
                channelId: 1 
            });
            setNotificationText("");
            if(newMessage)
                setMessages(prev => [...prev, newMessage]);
        } catch (err) {
            setError(err.message);
            setSending(false);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div>Loading chat...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <h1 className="chat-title">Chat for the report: "{report.title}"</h1>
            <div className="chat-container-fixed">
                <div className="chat-messages-scroll" ref={chatScrollRef}>
                    <div className="chat-fade-top" />
                    {officerUsername && (
                        <div className="chat-officer-label">
                            {officerUsername}
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <div>There are no messages in the chat yet</div>
                    ) : (
                        <>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.senderId === user.id ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                }}
                            >
                                <div
                                    className={`chat-message-wrapper ${msg.senderId === user.id ? 'chat-message-right' : 'chat-message-left'}`}
                                >
                                    <Message message={msg} user={user} />
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                        </>
                    )}
                </div>
                {user && ( //!TODO change it after OfficerPage is available
                    <div className="chat-notification-form">
                        <input
                            type="text"
                            value={notificationText}
                            onChange={e => setNotificationText(e.target.value)}
                            placeholder="Write a message..."
                            disabled={sending}
                        />
                        <button
                            onClick={handleSendNotification}
                            disabled={sending || !notificationText.trim()}
                            title="Send message"
                        >
                            <i className="bi bi-send"></i>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}