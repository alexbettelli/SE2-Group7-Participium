import '../styles/ChatPage.css';

import { useRef, useEffect, useState } from "react";
import PropTypes from 'prop-types';

import Message from "./Message.jsx";

import NotificationAPI from '../api/NotificationAPI.mjs';


export default function ChatPage(props) {
    const { report, user, setUnreadNotifications, chatWith } = props;
    const [messages, setMessages] = useState(chatWith === "user" ? report.notifications : report.comments);
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
                    const readNotifications = (chatWith === "user") ? await NotificationAPI.setReadNotifications(report.id) : await NotificationAPI.setReadComments(report.id);
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
            const sortedMessages = (chatWith === "user") ? [...report.notifications].sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt)) : [...report.comments].sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));
            setMessages(sortedMessages);
        }
    }, [report, user.id]);

    useEffect(() => {
        if (!loading && chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [loading]);

    // Compute send-permission clearly to avoid precedence/parentheses bugs
    const canSend = (user?.role?.id === 6)
        || (user?.role?.id === 4 && ((chatWith === "maintainer" && report.externalMaintainer) || chatWith === "user"))
        || (user?.role?.id === 1 && !!report.employee);

    
    const handleSendNotification = async () => {
        if (!notificationText.trim()) return;
        setSending(true);
        try {
            const newMessage = (chatWith === "user") ? await NotificationAPI.submitNotification({
                reportId: report.id,
                senderId: user.id || 1,
                receiverId: report.user.id === user.id ? report.employee.id : report.user.id,
                text: notificationText,
                channelId: 1
            }) :
            await NotificationAPI.submitComment({
                reportId: report.id,
                senderId: user.id,
                receiverId: (user.id === report.employee.id) ? report.externalMaintainer.id : report.employee.id,
                text: notificationText,
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
                    {chatWith=== "user" && (user.role.id !== 1 ? report.user.username : (report.employee ? report.employee.username : 'No officer assigned'))}
                    {chatWith=== "maintainer" && (user.role.id !== 4 ? report.employee.username : (report.externalMaintainer ? report.externalMaintainer.username : 'No maintainer assigned'))}
                </div>
                <div className="chat-report-title">
                    REPORT: "{report.title}"
                </div>
            </div>
            <div className="chat-container-fixed">
                <div className="chat-messages-scroll" ref={chatScrollRef}>
                    {messages.length === 0 ? (
                        (() => {
                            console.log(report);
                            console.log(user);
                            const placeholderText = (chatWith === "user")
                                ? (!report.employee ? (
                                        <span>
                                            Your report is currently under review.<br /> <br />  
                                            Messaging will be enabled once an officer has been assigned.<br />
                                            You will receive a notification as soon as your report is accepted.<br /><br />
                                            Thank you for your patience, the Participium Team
                                        </span>
                                    ) 
                                    : 'There are no messages in the chat yet')
                                : (!report.externalMaintainer ? (
                                    <span>
                                            The report has been forwarded to the external company.<br /> <br />  
                                            Messaging will be enabled once a maintainer takes in charge the report.<br />
                                            You will receive a notification as soon as the request is accepted.<br /><br />
                                            Thank you for your patience, the Participium Team
                                        </span>
                                        
                                    ) 
                                    : 'There are no messages in the chat yet');
                            const placeholderSender = { id: 0, username: "system" } ;
                            const placeholderMsg = {
                                id: `placeholder-${chatWith}`,
                                text: placeholderText,
                                sender: placeholderSender,
                                receiver: { id: user.id },
                                sendAt: new Date().toISOString()
                            };
                            return (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '80%' }}>
                                    <div className={`chat-message-wrapper chat-message-left`}>
                                        <Message message={placeholderMsg} user={user} />
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={msg.id ?? `${msg.sendAt ?? 'no-time'}-${msg.sender?.id ?? 'no-sender'}-${msg.receiver?.id ?? 'no-receiver'}-${idx}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: ((msg.sender && msg.sender.id === user.id) || (!msg.sender && user.id !== msg.receiver.id)) ? 'flex-end' : 'flex-start',
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
                {canSend && (
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
    setUnreadNotifications: PropTypes.func.isRequired,
    chatWith: PropTypes.oneOf(['user', 'maintainer']).isRequired
};