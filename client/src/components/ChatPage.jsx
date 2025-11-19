import { useEffect, useState } from "react";
import { getReportChatMessages } from "../api/API.mjs";
import '../styles/ChatPage.css';
import '../styles/commonStyle.css';
import Message from "./Message.jsx";

export default function ChatPage(props){
    const { report, user } = props;
    const [messages, setMessages] = useState([]);
    const [officerUsername, setOfficerUsername] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (report?.id) {
            setLoading(true);
            getReportChatMessages(report.id)
                .then(msgs => {
                    setMessages(msgs);
                    // officerUsername: primo senderUsername che NON è l'utente corrente
                    const officerMsg = msgs.find(m => m.senderId !== user.id);
                    setOfficerUsername(officerMsg ? officerMsg.senderUsername : null);
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [report, user.id]);

    if (loading) return <div>Caricamento chat...</div>;
    if (error) return <div>Errore: {error}</div>;

    return (
        <>
            <h1 className="page-title">{report.title}</h1>
            <hr className="title-divider" />
            <div className="chat-container">
                <div className="chat-messages">
                    {officerUsername && (
                        <div className="chat-officer-label">
                            {officerUsername}
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <div>Nessun messaggio nella chat.</div>
                    ) : (
                        messages.map(msg => (
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
                        ))
                    )}
                </div>
            </div>
        </>
    );
}