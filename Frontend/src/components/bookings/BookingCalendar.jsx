import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';

const BookingCalendar = ({ serviceId, onSlotSelect, selectedSlot }) => {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
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
      const response = await api.get('/bookings/available-slots', {
        params: { service_id: serviceId, date: dateStr }
      });
      
      setAvailableSlots(response.data.available || []);
      setBookedSlots(response.data.booked || []);
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

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        return 'text-muted bg-light';
      }
      
      // Check if date has any available slots
      const dateStr = date.toISOString().split('T')[0];
      // This would need to be implemented with actual availability data
    }
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
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
            tileClassName={tileClassName}
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
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;

                if (isBooked) return null;

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
              {selectedTime && (
                <Badge bg="success" className="ms-auto">
                  Selected: {selectedTime}
                </Badge>
              )}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default BookingCalendar;