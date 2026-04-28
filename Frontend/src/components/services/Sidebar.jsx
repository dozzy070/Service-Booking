import React from 'react';
import {
  Card,
  Nav,
  Badge,
  ListGroup,
  Button
} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaServicestack,
  FaCalendarCheck,
  FaComments,
  FaUser,
  FaCog,
  FaChartBar,
  FaUsers,
  FaShieldAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const commonItems = [
      { path: '/', icon: FaHome, label: 'Home' },
      { path: '/services', icon: FaServicestack, label: 'Services' }
    ];

    if (!user) {
      return commonItems;
    }

    const authItems = [
      { path: '/bookings', icon: FaCalendarCheck, label: 'My Bookings' },
      { path: '/chat', icon: FaComments, label: 'Messages', badge: '3' },
      { path: '/profile', icon: FaUser, label: 'Profile' }
    ];

    const roleSpecificItems = [];

    if (user.role === 'provider') {
      roleSpecificItems.push(
        { path: '/provider/dashboard', icon: FaChartBar, label: 'Dashboard' },
        { path: '/create-service', icon: FaServicestack, label: 'Add Service' }
      );
    }

    if (user.role === 'admin') {
      roleSpecificItems.push(
        { path: '/admin/dashboard', icon: FaChartBar, label: 'Dashboard' },
        { path: '/admin/users', icon: FaUsers, label: 'Users' },
        { path: '/admin/services', icon: FaServicestack, label: 'Services' },
        { path: '/admin/analytics', icon: FaChartBar, label: 'Analytics' }
      );
    }

    roleSpecificItems.push(
      { path: '/settings', icon: FaCog, label: 'Settings' }
    );

    return [...commonItems, ...authItems, ...roleSpecificItems];
  };

  const menuItems = getMenuItems();

  return (
    <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
      <Card.Body className="p-0">
        {/* User Info */}
        {user && (
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                alt={user.name}
                className="rounded-circle me-3"
                style={{ width: 50, height: 50, objectFit: 'cover' }}
              />
              <div>
                <h6 className="mb-1">{user.name}</h6>
                <Badge bg="primary" pill>{user.role}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <Nav className="flex-column p-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Nav.Link
                key={index}
                as={Link}
                to={item.path}
                className={`d-flex align-items-center py-2 px-3 mb-1 rounded ${
                  isActive ? 'bg-primary text-white' : 'text-dark'
                }`}
              >
                <Icon className="me-3" />
                <span className="flex-grow-1">{item.label}</span>
                {item.badge && (
                  <Badge bg={isActive ? 'light' : 'primary'} pill>
                    {item.badge}
                  </Badge>
                )}
              </Nav.Link>
            );
          })}
        </Nav>

        {/* Additional Info */}
        {user && user.role === 'provider' && (
          <div className="p-3 border-top">
            <h6 className="mb-3">Quick Stats</h6>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">Today's Bookings</span>
                <Badge bg="info">3</Badge>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">Pending Requests</span>
                <Badge bg="warning">2</Badge>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">This Month</span>
                <Badge bg="success">$1,234</Badge>
              </ListGroup.Item>
            </ListGroup>
          </div>
        )}

        {/* Premium/Upgrade Banner */}
        {user && user.role === 'customer' && (
          <div className="p-3 border-top">
            <Card className="bg-primary text-white border-0">
              <Card.Body className="p-3">
                <FaShieldAlt size={24} className="mb-2" />
                <h6 className="mb-2">Become a Provider</h6>
                <p className="small mb-3">
                  List your services and start earning today!
                </p>
                <Button
                  as={Link}
                  to="/become-provider"
                  variant="light"
                  size="sm"
                  className="w-100"
                >
                  Learn More
                </Button>
              </Card.Body>
            </Card>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default Sidebar;