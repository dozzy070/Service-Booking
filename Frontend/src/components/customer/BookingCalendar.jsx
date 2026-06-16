import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaArrowLeft,
  FaArrowRight,
  FaRegClock,
  FaStar,
  FaExclamationTriangle,
  FaBell
} from 'react-icons/fa';
import { format, isToday, isTomorrow, differenceInDays, addDays, subDays } from 'date-fns';
import api from '../../api';
import toast from 'react-hot-toast';

const BookingCalendar = ({ 
  serviceId, 
  providerId, 
  onSlotSelect, 
  selectedSlot,
  minDate = new Date(),
  maxDays = 30,
  bufferTime = 30,
  showPeakTimes = true,
  showHolidays = true
}) => {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);
  const [dateInfo, setDateInfo] = useState(null);
  const [view, setView] = useState('month');

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch availability
  const fetchAvailability = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get('/bookings/available-slots', {
        params: { 
          service_id: serviceId, 
          date: dateStr,
          provider_id: providerId || undefined
        }
      });
      
      setAvailableSlots(response.data.available || []);
      setBookedSlots(response.data.booked || []);
      setPeakHours(response.data.peak_hours || ['09:00', '10:00', '16:00', '17:00']);
      setHolidays(response.data.holidays || []);
      setSpecialDates(response.data.special_dates || []);
      setDateInfo(response.data.date_info || null);
    } catch (error) {
      console.error('Error fetching availability:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch availability');
      }
    } finally {
      setLoading(false);
    }
  }, [date, serviceId, providerId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedTime(null);
    if (onSlotSelect) {
      onSlotSelect(null);
    }
  };

  // Handle time select
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (onSlotSelect) {
      const bookingDate = new Date(date);
      const [hours, minutes] = time.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onSlotSelect(bookingDate);
    }
  };

  // Check if date is disabled
  const isDateDisabled = ({ date: tileDate, view: calendarView }) => {
    if (calendarView !== 'month') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (tileDate < today) return true;
    
    // Check max days
    const daysDiff = differenceInDays(tileDate, today);
    if (daysDiff > maxDays) return true;
    
    // Check holidays
    const dateStr = format(tileDate, 'yyyy-MM-dd');
    if (holidays.includes(dateStr)) return true;
    
    return false;
  };

  // Get tile class name
  const getTileClassName = ({ date: tileDate, view: calendarView }) => {
    if (calendarView !== 'month') return '';
    
    const dateStr = format(tileDate, 'yyyy-MM-dd');
    if (holidays.includes(dateStr)) return 'holiday-tile';
    if (specialDates.includes(dateStr)) return 'special-tile';
    if (isToday(tileDate)) return 'today-tile';
    
    return '';
  };

  // Get tile content
  const getTileContent = ({ date: tileDate, view: calendarView }) => {
    if (calendarView !== 'month') return null;
    
    const dateStr = format(tileDate, 'yyyy-MM-dd');
    if (specialDates.includes(dateStr)) {
      const special = specialDates.find(d => d.date === dateStr);
      return (
        <div className="tile-badge special-badge">
          <small>{special?.label || '🎉'}</small>
        </div>
      );
    }
    return null;
  };

  // Check if time is available
  const isTimeAvailable = (time) => {
    return availableSlots.includes(time) && !bookedSlots.includes(time);
  };

  // Check if time is peak
  const isPeakTime = (time) => {
    return peakHours.includes(time);
  };

  // Get time slot price modifier
  const getTimePriceModifier = (time) => {
    if (isPeakTime(time)) return 1.2; // 20% premium
    return 1.0;
  };

  // Generate time slots (30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Navigate to next/prev day
  const goToNextDay = () => {
    const nextDate = addDays(date, 1);
    if (!isDateDisabled({ date: nextDate, view: 'month' })) {
      setDate(nextDate);
    }
  };

  const goToPrevDay = () => {
    const prevDate = subDays(date, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (prevDate >= today) {
      setDate(prevDate);
    }
  };

  // Format date display
  const formatDateDisplay = (dateObj) => {
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    return format(dateObj, 'EEEE, MMMM d, yyyy');
  };

  return (
    <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
      <Card.Body className="p-4">
        <h6 className="mb-4 fw-bold d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-primary" />
          Select Date & Time
        </h6>

        {/* Date Navigation */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={goToPrevDay}
            className="rounded-pill"
          >
            <FaArrowLeft size={12} className="me-1" />
            Previous
          </Button>
          <div className="text-center">
            <span className="fw-semibold">{formatDateDisplay(date)}</span>
            {isToday(date) && (
              <Badge bg="success" className="ms-2 rounded-pill">
                Today
              </Badge>
            )}
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={goToNextDay}
            className="rounded-pill"
          >
            Next
            <FaArrowRight size={12} className="ms-1" />
          </Button>
        </div>

        {/* Calendar */}
        <div className="booking-calendar mb-4">
          <Calendar
            onChange={handleDateChange}
            value={date}
            minDate={minDate}
            tileDisabled={isDateDisabled}
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            className="border-0 w-100"
            prevLabel="‹"
            nextLabel="›"
            prev2Label="«"
            next2Label="»"
          />
        </div>

        {/* Date Info */}
        {dateInfo && (
          <Alert variant="info" className="mb-3" style={{ borderRadius: '12px' }}>
            <div className="d-flex gap-2 align-items-start">
              <FaInfoCircle className="mt-1" />
              <div>
                <strong>{dateInfo.title}</strong>
                <p className="mb-0 small">{dateInfo.message}</p>
              </div>
            </div>
          </Alert>
        )}

        {/* Time Slots */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="text-muted mt-2 small">Checking availability...</p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 d-flex align-items-center">
                <FaClock className="me-2 text-primary" />
                Available Times
              </h6>
              <Badge bg="light" text="dark" className="rounded-pill">
                {availableSlots.filter(s => !bookedSlots.includes(s)).length} slots available
              </Badge>
            </div>

            {availableSlots.filter(s => !bookedSlots.includes(s)).length === 0 ? (
              <div className="text-center py-4">
                <FaTimesCircle size={32} className="text-muted mb-2 opacity-50" />
                <p className="text-muted mb-1">No available time slots</p>
                <small className="text-muted">Please select a different date</small>
              </div>
            ) : (
              <>
                <div className="time-slots-grid">
                  {timeSlots.map(time => {
                    const isAvailable = isTimeAvailable(time);
                    const isSelected = selectedTime === time;
                    const isPeak = isPeakTime(time);
                    
                    if (!isAvailable) return null;
                    
                    return (
                      <OverlayTrigger
                        key={time}
                        placement="top"
                        overlay={
                          <Tooltip>
                            {isPeak ? 'Peak hour (+20% premium)' : 'Standard rate'}
                          </Tooltip>
                        }
                      >
                        <Button
                          variant={isSelected ? 'primary' : isPeak ? 'outline-warning' : 'outline-primary'}
                          size="sm"
                          onClick={() => handleTimeSelect(time)}
                          className={`time-slot-btn ${isPeak ? 'peak-hour' : ''} ${isSelected ? 'selected' : ''}`}
                        >
                          <FaRegClock className="me-1" size={10} />
                          {time}
                          {isPeak && (
                            <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: '8px' }}>
                              Peak
                            </Badge>
                          )}
                          {isSelected && (
                            <FaCheckCircle className="ms-1" size={10} />
                          )}
                        </Button>
                      </OverlayTrigger>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="d-flex flex-wrap align-items-center gap-3 mt-3 pt-2 border-top">
                  <div className="d-flex align-items-center gap-1">
                    <div className="bg-primary rounded-circle" style={{ width: 10, height: 10 }} />
                    <small className="text-muted">Available</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div className="bg-warning rounded-circle" style={{ width: 10, height: 10 }} />
                    <small className="text-muted">Peak Hour (+20%)</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div className="bg-secondary rounded-circle" style={{ width: 10, height: 10 }} />
                    <small className="text-muted">Unavailable</small>
                  </div>
                  {bufferTime > 0 && (
                    <div className="d-flex align-items-center gap-1">
                      <FaClock size={10} className="text-info" />
                      <small className="text-muted">{bufferTime}min buffer</small>
                    </div>
                  )}
                </div>

                {/* Selected time info */}
                {selectedTime && (
                  <Alert variant="success" className="mt-3 mb-0 py-2" style={{ borderRadius: '10px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <FaCheckCircle className="me-2" size={14} />
                        <span className="fw-semibold">Selected: {selectedTime}</span>
                        {isPeakTime(selectedTime) && (
                          <Badge bg="warning" text="dark" className="ms-2">
                            Peak rate applies
                          </Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {formatDateDisplay(date)}
                      </small>
                    </div>
                  </Alert>
                )}

                {/* Booking notice */}
                <Alert variant="secondary" className="mt-3 mb-0 py-2" style={{ fontSize: '12px', borderRadius: '10px' }}>
                  <FaBell className="me-1" size={12} />
                  Please arrive 10 minutes before your scheduled time.
                  {bufferTime > 0 && ` There's a ${bufferTime} minute buffer between bookings.`}
                </Alert>
              </>
            )}
          </>
        )}
      </Card.Body>

      <style jsx="true">{`
        .booking-calendar {
          --calendar-bg: var(--card-bg);
          --calendar-text: var(--text-color);
        }
        
        .react-calendar {
          background: var(--calendar-bg);
          border: none;
          font-family: inherit;
          width: 100%;
        }
        
        .react-calendar__navigation {
          margin-bottom: 1rem;
        }
        
        .react-calendar__navigation button {
          color: var(--text-color);
          font-weight: 500;
        }
        
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: var(--hover-bg);
          border-radius: 8px;
        }
        
        .react-calendar__month-view__weekdays {
          color: var(--text-muted);
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        
        .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          color: var(--text-color);
        }
        
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: var(--hover-bg);
          border-radius: 8px;
        }
        
        .react-calendar__tile--active {
          background: #10b981 !important;
          color: white !important;
          border-radius: 8px;
        }
        
        .react-calendar__tile--now {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .holiday-tile {
          background: #fee2e2;
          color: #dc2626;
          text-decoration: line-through;
        }
        
        .special-tile {
          background: #fef3c7;
          color: #d97706;
        }
        
        .today-tile {
          border: 2px solid #10b981;
        }
        
        .tile-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 10px;
        }
        
        .special-badge {
          background: #fef3c7;
          color: #d97706;
          border-radius: 12px;
          padding: 0 4px;
        }
        
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, auto));
          gap: 8px;
        }
        
        .time-slot-btn {
          border-radius: 25px !important;
          padding: 6px 12px !important;
          font-size: 13px !important;
          transition: all 0.2s !important;
        }
        
        .time-slot-btn.peak-hour {
          border-color: #f59e0b !important;
          color: #f59e0b !important;
        }
        
        .time-slot-btn.peak-hour:hover,
        .time-slot-btn.peak-hour:focus {
          background: #f59e0b !important;
          color: white !important;
        }
        
        .time-slot-btn.selected {
          background: #10b981 !important;
          color: white !important;
          border-color: #10b981 !important;
        }
        
        @media (max-width: 768px) {
          .time-slots-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, auto));
          }
          
          .react-calendar__tile {
            padding: 0.5rem 0.25rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </Card>
  );
};

export default BookingCalendar;