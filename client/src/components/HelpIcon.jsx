import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/HelpIcon.css';

export default function HelpIcon({ text, placement = 'top' }) {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const iconRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (iconRef.current && !iconRef.current.contains(event.target) &&
                tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setShow(false);
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show]);

    useEffect(() => {
        if (show && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            setPosition({
                top: rect.top + scrollY,
                left: rect.left + scrollX,
                width: rect.width,
                height: rect.height
            });
        }
    }, [show]);

    const handleShow = () => {
        setShow(true);
    };

    const handleHide = () => {
        setShow(false);
    };

    return (
        <>
            <span 
                className="help-icon-wrapper" 
                ref={iconRef}
                onMouseEnter={handleShow}
                onMouseLeave={handleHide}
            >
                <i 
                    className="bi bi-question-circle help-icon"
                    onClick={() => setShow(!show)}
                />
            </span>
            {show && createPortal(
                <div 
                    ref={tooltipRef}
                    className={`help-tooltip-portal help-tooltip-${placement}`}
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        '--icon-width': `${position.width}px`,
                        '--icon-height': `${position.height}px`
                    }}
                    onMouseEnter={handleShow}
                    onMouseLeave={handleHide}
                >
                    <div className="help-tooltip-content">
                        {text}
                    </div>
                    <div className="help-tooltip-arrow"></div>
                </div>,
                document.body
            )}
        </>
    );
}

