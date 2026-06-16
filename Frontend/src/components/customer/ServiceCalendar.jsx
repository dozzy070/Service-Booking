import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
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
  FaCalendarCheck,
  FaBell
} from 'react-icons/fa';
import api from '../../api';
import { format, isToday, isTomorrow, differenceInDays, addDays, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const ServiceCalendar = ({ serviceId, providerId, onSlotSelect, selectedDateTime }) => {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookingWindow, setBookingWindow] = useState({
    minDays: 0,
    maxDays: 30,
    bufferTime: 30
  });
  const [peakHours, setPeakHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date for display
  const formatDate = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getDayStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (holidays.includes(dateStr)) return 'holiday';
    if (specialDates.includes(dateStr)) return 'special';
    return 'normal';
  };

  // Fetch service availability
  const fetchAvailability = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/services/${serviceId}/availability`, {
        params: { date: dateStr }
      });
      
      setAvailableSlots(response.data.available_slots || []);
      setTimeSlots(response.data.time_slots || getDefaultTimeSlots());
      setBookingWindow({
        minDays: response.data.min_booking_days || 0,
        maxDays: response.data.max_booking_days || 30,
        bufferTime: response.data.buffer_time || 30
      });
      setPeakHours(response.data.peak_hours || ['09:00', '10:00', '16:00', '17:00']);
      setHolidays(response.data.holidays || []);
      setSpecialDates(response.data.special_dates || []);
      setSelectedDateInfo(response.data.date_info || null);
    } catch (error) {
      console.error('Error fetching availability:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch availability');
      }
      // Set default time slots as fallback
      setTimeSlots(getDefaultTimeSlots());
    } finally {
      setLoading(false);
    }
  }, [date, serviceId]);

  // Get default time slots
  const getDefaultTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour !== 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Sync with parent component
  useEffect(() => {
    if (selectedDateTime) {
      const newDate = new Date(selectedDateTime);
      setDate(newDate);
      const timeStr = format(newDate, 'HH:mm');
      if (availableSlots.includes(timeStr)) {
        setSelectedTime(timeStr);
      }
    }
  }, [selectedDateTime, availableSlots]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedTime(null);
    setSelectedDateInfo(null);
    if (onSlotSelect) {
      onSlotSelect(null);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (onSlotSelect) {
      const bookingDate = new Date(date);
      const [hours, minutes] = time.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onSlotSelect(bookingDate);
    }
  };

  const isDateDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Check min/max booking window
    const daysDiff = differenceInDays(date, today);
    if (daysDiff < bookingWindow.minDays) return true;
    if (daysDiff > bookingWindow.maxDays) return true;
    
    // Check holidays
    const dateStr = format(date, 'yyyy-MM-dd');
    if (holidays.includes(dateStr)) return true;
    
    return false;
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (holidays.includes(dateStr)) return 'holiday-tile';
    if (specialDates.includes(dateStr)) return 'special-tile';
    if (isToday(date)) return 'today-tile';
    
    return '';
  };

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
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

  const isTimeAvailable = (time) => {
    return availableSlots.includes(time);
  };

  const isPeakHour = (time) => {
    return peakHours.includes(time);
  };

  const getTimeSlotPrice = (time) => {
    if (isPeakHour(time)) return 1.2; // 20% premium
    return 1.0;
  };

  const getNextAvailableDate = () => {
    let nextDate = new Date();
    let daysChecked = 0;
    while (daysChecked < 30) {
      nextDate = addDays(nextDate, 1);
      if (!isDateDisabled({ date: nextDate, view: 'month' })) {
        return nextDate;
      }
      daysChecked++;
    }
    return null;
  };

  const handleNextDay = () => {
    const nextDate = addDays(date, 1);
    if (!isDateDisabled({ date: nextDate, view: 'month' })) {
      setDate(nextDate);
    }
  };

  const handlePrevDay = () => {
    const prevDate = subDays(date, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (prevDate >= today) {
      setDate(prevDate);
    }
  };

  const nextAvailableDate = getNextAvailableDate();

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
            onClick={handlePrevDay}
            disabled={isDateDisabled({ date: subDays(date, 1), view: 'month' })}
            className="rounded-pill"
          >
            <FaArrowLeft size={12} className="me-1" />
            Previous
          </Button>
          <div className="text-center">
            <span className="fw-semibold">{formatDate(date)}</span>
            {bookingWindow.minDays > 0 && (
              <Badge bg="info" className="ms-2 rounded-pill">
                {bookingWindow.minDays}-day notice
              </Badge>
            )}
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleNextDay}
            className="rounded-pill"
          >
            Next
            <FaArrowRight size={12} className="ms-1" />
          </Button>
        </div>

        {/* Calendar */}
        <div className="service-calendar mb-4">
          <Calendar
            onChange={handleDateChange}
            value={date}
            minDate={new Date()}
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

        {selectedDateInfo && (
          <Alert variant="info" className="mb-3" style={{ borderRadius: '12px' }}>
            <div className="d-flex gap-2">
              <FaInfoCircle />
              <div>
                <strong>{selectedDateInfo.title}</strong>
                <p className="mb-0 small">{selectedDateInfo.message}</p>
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
                {availableSlots.length} slots available
              </Badge>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-4">
                <FaTimesCircle size={32} className="text-muted mb-2 opacity-50" />
                <p className="text-muted mb-1">No available time slots</p>
                {nextAvailableDate && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setDate(nextAvailableDate)}
                    className="mt-2"
                  >
                    <FaCalendarCheck className="me-1" />
                    Check {format(nextAvailableDate, 'MMM d')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="time-slots-grid">
                  {timeSlots.map(time => {
                    const isAvailable = isTimeAvailable(time);
                    const isSelected = selectedTime === time;
                    const isPeak = isPeakHour(time);
                    
                    if (!isAvailable) return null;
                    
                    return (
                      <Button
                        key={time}
                        variant={isSelected ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => handleTimeSelect(time)}
                        className={`time-slot-btn ${isPeak ? 'peak-hour' : ''}`}
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
                  {bookingWindow.bufferTime > 0 && (
                    <div className="d-flex align-items-center gap-1">
                      <FaClock size={10} className="text-info" />
                      <small className="text-muted">{bookingWindow.bufferTime}min buffer</small>
                    </div>
                  )}
                </div>

                {/* Booking Notice */}
                {bookingWindow.minDays > 0 && (
                  <Alert variant="secondary" className="mt-3 mb-0 py-2" style={{ fontSize: '12px', borderRadius: '10px' }}>
                    <FaBell className="me-1" size={12} />
                    Please book at least {bookingWindow.minDays} day{bookingWindow.minDays > 1 ? 's' : ''} in advance
                  </Alert>
                )}
              </>
            )}
          </>
        )}
      </Card.Body>

      <style jsx="true">{`
        .service-calendar {
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

export default ServiceCalendar;