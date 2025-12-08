import '../styles/ChatPage.css';

import { useRef, useEffect, useState } from "react";
import PropTypes from 'prop-types';

import Message from "./Message.jsx";

import NotificationAPI from '../api/NotificationAPI.mjs';


export default function ChatPage(props) {
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
                    const readNotifications = await NotificationAPI.setReadNotifications(report.id);
                    setUnreadNotifications(prev => prev - readNotifications);
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
            const newMessage = await NotificationAPI.submitNotification({
                reportId: report.id,
                senderId: report.employee.id || 1,
                receiverId: report.user.id,
                text: notificationText,
                channelId: 1
            });
            setNotificationText("");
            if (newMessage) {
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
                    {user.role.id !== 1 ? report.user.username : (report.employee ? report.employee.username : 'No officer assigned')}
                </div>
                <div className="chat-report-title">
                    REPORT: "{report.title}"
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
                                        justifyContent: ((msg.sender && msg.sender.id === user.id) || (!msg.sender && user.role.id !== 1)) ? 'flex-end' : 'flex-start',
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
                {user.role.id !== 1 && (
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

ChatPage.propTypes = {
    report: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        notifications: PropTypes.arrayOf(PropTypes.object).isRequired,
        user: PropTypes.shape({
            id: PropTypes.number.isRequired,
            username: PropTypes.string.isRequired
        }).isRequired,
        employee: PropTypes.shape({
            id: PropTypes.number,
            username: PropTypes.string
        })
    }).isRequired,
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        role: PropTypes.shape({
            id: PropTypes.number.isRequired
        }).isRequired
    }).isRequired,
    unreadNotifications: PropTypes.number.isRequired,
    setUnreadNotifications: PropTypes.func.isRequired
};