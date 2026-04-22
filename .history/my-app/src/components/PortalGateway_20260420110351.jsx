import React, { useState } from 'react';
import { FaGraduationCap, FaUserShield, FaArrowRight } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './PortalGateway.scss';

const PortalGateway = ({ onSelectPortal }) => {
  const { theme } = useTheme();
  const [hoveredOption, setHoveredOption] = useState(null);

  const portalOptions = [
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Access your hostel application, track status, and manage your profile',
      icon: FaGraduationCap,
      color: 'blue',
      features: ['Login & Registration', 'Apply for Hostel', 'Track Applications', 'Manage Profile'],
    },
    {
      id: 'admin',
      title: 'Admin Manager',
      description: 'Monitor applications, manage students, and oversee hostel operations',
      icon: FaUserShield,
      color: 'red',
      features: ['Admin Dashboard', 'Review Applications', 'Manage Rooms', 'Student Records'],
    },
  ];

  return (
    <div className={`portal-gateway ${theme}`}>
      <div className="gateway-header">
        <h1>Welcome to CampusStay Portal</h1>
        <p>Select your role to continue</p>
      </div>

      <div className="gateway-container">
        <div className="gateway-options">
          {portalOptions.map((option) => {
            const Icon = option.icon;
            const isHovered = hoveredOption === option.id;

            return (
              <div
                key={option.id}
                className={`portal-card ${option.color} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={() => onSelectPortal(option.id)}
              >
                <div className="card-icon">
                  <Icon />
                </div>

                <div className="card-content">
                  <h2>{option.title}</h2>
                  <p className="card-description">{option.description}</p>

                  <div className="card-features">
                    {option.features.map((feature, idx) => (
                      <div key={idx} className="feature-tag">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-action">
                  <FaArrowRight className="arrow-icon" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gateway-footer">
        <p>Choose your portal to get started with CampusStay</p>
      </div>
    </div>
  );
};

export default PortalGateway;
