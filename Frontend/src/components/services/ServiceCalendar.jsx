import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaClock, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';

const ServiceCalendar = ({ serviceId, onSlotSelect }) => {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (serviceId) {
      fetchAvailability();
    }
  }, [date, serviceId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await api.get(`/services/${serviceId}/availability`, {
        params: { date: dateStr }
      });
      
      setAvailableSlots(response.data.available || []);
    } catch (error) {
      toast.error('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedTime(null);
    if (onSlotSelect) {
      onSlotSelect(null);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (onSlotSelect) {
      const bookingDate = new Date(date);
      const [hours, minutes] = time.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes));
      onSlotSelect(bookingDate);
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      // Disable past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    }
    return false;
  };

  // Sample time slots - in real app, these would come from the API
  const timeSlots = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
  ];

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h6 className="mb-3">
          <FaCalendarAlt className="me-2 text-primary" />
          Select Date & Time
        </h6>

        <div className="mb-4">
          <Calendar
            onChange={handleDateChange}
            value={date}
            minDate={new Date()}
            tileDisabled={tileDisabled}
            className="border-0 w-100"
          />
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="text-muted mt-2">Checking availability...</p>
          </div>
        ) : (
          <>
            <h6 className="mb-3">
              <FaClock className="me-2 text-primary" />
              Available Times for {formatDate(date)}
            </h6>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {timeSlots.map(time => {
                const isAvailable = availableSlots.includes(time);
                const isSelected = selectedTime === time;

                return (
                  <Button
                    key={time}
                    variant={isSelected ? 'primary' : isAvailable ? 'outline-primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => isAvailable && handleTimeSelect(time)}
                    disabled={!isAvailable}
                    className="position-relative"
                  >
                    {time}
                    {isSelected && (
                      <FaCheckCircle className="ms-1 text-white" size={12} />
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="d-flex align-items-center gap-3 mt-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle me-1" style={{ width: 10, height: 10 }} />
                <small className="text-muted">Available</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-secondary rounded-circle me-1" style={{ width: 10, height: 10 }} />
                <small className="text-muted">Unavailable</small>
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ServiceCalendar;