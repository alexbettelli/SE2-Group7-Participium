import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/OfficeDropdown.css';


export default function OfficeDropdown({offices,selectedOffices, onSelect, onDeselect}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  return (
    <>
      <fieldset className = "office-dropdown" ref={dropdownRef}>
        <button onClick = {() => setIsDropdownOpen(!isDropdownOpen)}>
          -- select offices --
        </button>
        {isDropdownOpen && (
          <div className="panel">
            {offices?.map((office) => {
              const isAssigned = selectedOffices?.some(oId => oId === office.id);
              return (
              <fieldset key={office.id} onClick={() => !isAssigned ? onSelect(office.id) : onDeselect(office.id)} style={{cursor: 'pointer'}}>
                <input id={office.id} type="checkbox" checked={isAssigned} readOnly style={{pointerEvents: 'none'}} />
                <label key={office.id} htmlFor={office.id} style={{pointerEvents: 'none'}}>{office.name}</label>
              </fieldset>
            )})}
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
  onSelect: PropTypes.func.isRequired
};