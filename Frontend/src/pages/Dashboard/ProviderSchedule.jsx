// src/pages/provider/ProviderSchedule.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { FaClock, FaTrash, FaPlus } from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ProviderSchedule = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/provider/schedule');
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = async (day) => {
    const start = prompt('Enter start time (e.g., 09:00)');
    const end = prompt('Enter end time (e.g., 17:00)');
    if (!start || !end) return;
    try {
      await api.post('/provider/schedule', { day, start, end });
      toast.success('Time slot added');
      fetchSchedule();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add slot');
    }
  };

  const removeTimeSlot = async (slotId) => {
    if (!window.confirm('Remove this time slot?')) return;
    try {
      await api.delete(`/provider/schedule/${slotId}`);
      toast.success('Slot removed');
      fetchSchedule();
    } catch (err) {
      toast.error('Failed to remove slot');
    }
  };

  if (loading) return <div>Loading schedule...</div>;

  return (
    <Container fluid>
      <h2 className="mb-4">Manage Schedule</h2>
      <Row>
        {days.map(day => (
          <Col md={6} lg={4} key={day} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold">{day}</Card.Header>
              <Card.Body>
                {schedule[day]?.length > 0 ? (
                  schedule[day].map(slot => (
                    <div key={slot.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                      <span><FaClock className="me-2 text-primary" />{slot.start} – {slot.end}</span>
                      <Button variant="link" size="sm" onClick={() => removeTimeSlot(slot.id)}>
                        <FaTrash className="text-danger" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No slots</p>
                )}
                <Button variant="outline-primary" size="sm" onClick={() => addTimeSlot(day)} className="mt-2">
                  <FaPlus /> Add Slot
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProviderSchedule;