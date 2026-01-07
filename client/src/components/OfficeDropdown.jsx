import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/OfficeDropdown.css';


export default function OfficeDropdown({offices,selectedOffices, onSelect, onDeselect}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (isDropdownOpen) {
      setTempSelected(selectedOffices || []);
    }
  }, [isDropdownOpen, selectedOffices]);

  const toggleSelection = (officeId) => {
    if (tempSelected.includes(officeId)) {
      setTempSelected(tempSelected.filter(id => id !== officeId));
    } else {
      setTempSelected([...tempSelected, officeId]);
    }
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    const original = selectedOffices || [];
    
    tempSelected.forEach(id => {
      if (!original.includes(id)) {
        onSelect(id);
      }
    });
    original.forEach(id => {
      if (!tempSelected.includes(id)) {
        onDeselect(id);
      }
    });
    setIsDropdownOpen(false);
  };

  return (
    <>
      <fieldset className = "office-dropdown" ref={dropdownRef}>
        <button onClick = {() => setIsDropdownOpen(!isDropdownOpen)}>
          {selectedOffices?.length > 0 ? `${selectedOffices.length} Selected` : 'Select Offices'}
        </button>
        {isDropdownOpen && (
          <div className="panel">
            {offices?.map((office) => {
              const isAssigned = tempSelected.includes(office.id);
              return (
              <fieldset key={office.id} onClick={() => toggleSelection(office.id)} style={{cursor: 'pointer'}}>
                <input id={office.id} type="checkbox" checked={isAssigned} readOnly style={{pointerEvents: 'none'}} />
                <label key={office.id} htmlFor={office.id} style={{pointerEvents: 'none'}}>{office.name}</label>
              </fieldset>
            )})}
            <div style={{ padding: '0.5rem', borderTop: '1px solid #ccc' }}>
              <button 
                onClick={handleConfirm}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-wine-light)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </fieldset>
    </>
  );
}


OfficeDropdown.propTypes = {
  offices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  selectedOffices: PropTypes.arrayOf(PropTypes.number),
  onSelect: PropTypes.func.isRequired,
  onDeselect: PropTypes.func.isRequired
};