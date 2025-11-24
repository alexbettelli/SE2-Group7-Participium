import { useRef, useEffect, useState } from "react";
import '../styles/ChatPage.css';
import Message from "./Message.jsx";
import API from "../api/API.mjs";


export default function ChatPage(props){
    const { report, user, unreadNotifications, setUnreadNotifications } = props;
    const [messages, setMessages] = useState(report.notifications);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [notificationText, setNotificationText] = useState("");
    const [sending, setSending] = useState(false);
    const chatScrollRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        const markNotificationsRead = async () => {
            if (report?.id && user?.id) {
                try {
                    const readNotifications = await API.setReadNotifications(report.id);
                    setUnreadNotifications(prev => prev - readNotifications);
                    console.log("Notifiche aggiornate, ora sono: " , unreadNotifications);
                    setLoading(false)
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };
        markNotificationsRead();
    }, []);

    useEffect(() => {
        if (report?.id) {
            const sortedMessages = [...report.notifications].sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));
            setMessages(sortedMessages);
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
            if(newMessage) {
                setMessages(prev => {
                    const updated = [...prev, newMessage];
                    setTimeout(() => {
                        if (chatScrollRef.current) {
                            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                        }
                    }, 0);
                    return updated;
                });
            }
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
        <div className="chat-page-container">
            
            <div className="chat-header-row">
                <div className="chat-officer-label">
                    {report.employee ? report.employee.username : 'No officer assigned'}
                </div>
                <div className="chat-report-title">
                    Report title: "{report.title}"
                </div>
            </div>
            <div className="chat-container-fixed">
                <div className="chat-messages-scroll" ref={chatScrollRef}>
                    {messages.length === 0 ? (
                        <div>There are no messages in the chat yet</div>
                    ) : (
                        <>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: ((msg.sender && msg.sender.id === user.id) || (!msg.sender && user.role.type !== 'Citizen')) ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                }}
                            >
                                <div
                                    className={`chat-message-wrapper ${(msg.sender && msg.sender.id === user.id) ? 'chat-message-right' : 'chat-message-left'}`}
                                >
                                    <Message message={msg} user={user} />
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                        </>
                    )}
                </div>
                {user.role.type !== 'Citizen' && ( //!TODO change it after OfficerPage is available
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
        </div>
    );
}