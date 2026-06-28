// src/pages/provider/ProviderSchedule.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Modal,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  FaClock,
  FaTrash,
  FaPlus,
  FaEdit,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaRegClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaBell,
  FaCopy
} from 'react-icons/fa';
import { format, parse, isWithinInterval, addMinutes, differenceInMinutes } from 'date-fns';
import { providerAPI } from '../../api/api';
import toast from 'react-hot-toast';

const days = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const ProviderSchedule = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [bulkDays, setBulkDays] = useState([]);
  const [bulkStart, setBulkStart] = useState('09:00');
  const [bulkEnd, setBulkEnd] = useState('17:00');
  const [conflicts, setConflicts] = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch schedule from real API
  const fetchSchedule = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.getSchedule === 'function') {
        response = await providerAPI.getSchedule();
      } else if (typeof providerAPI.getProviderSchedule === 'function') {
        response = await providerAPI.getProviderSchedule();
      } else {
        throw new Error('Schedule API methods not available');
      }

      const data = response?.data || {};
      setSchedule(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError(error.message || 'Failed to load schedule');
      setSchedule({});
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load schedule');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchSchedule(true);
  }, []);

  // Polling for real-time updates
  useEffect(() => {
    const startPolling = () => {
      stopPolling();
      pollingInterval.current = setInterval(() => {
        if (!isPolling.current) {
          isPolling.current = true;
          fetchSchedule(false).finally(() => {
            isPolling.current = false;
          });
        }
      }, 30000); // Poll every 30 seconds
    };

    const stopPolling = () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      isPolling.current = false;
    };

    if (autoRefresh) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [autoRefresh, fetchSchedule]);

  // Check for time slot conflicts
  const checkConflicts = (day, start, end, excludeSlotId = null) => {
    const existingSlots = schedule[day] || [];
    const newStart = parse(start, 'HH:mm', new Date());
    const newEnd = parse(end, 'HH:mm', new Date());
    
    const conflicts = existingSlots.filter(slot => {
      if (excludeSlotId && slot.id === excludeSlotId) return false;
      
      const slotStart = parse(slot.start, 'HH:mm', new Date());
      const slotEnd = parse(slot.end, 'HH:mm', new Date());
      
      return (
        (newStart >= slotStart && newStart < slotEnd) ||
        (newEnd > slotStart && newEnd <= slotEnd) ||
        (newStart <= slotStart && newEnd >= slotEnd)
      );
    });
    
    return conflicts;
  };

  // Validate time slot
  const validateTimeSlot = (start, end) => {
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return false;
    }
    
    const duration = differenceInMinutes(endTime, startTime);
    if (duration < 30) {
      toast.error('Minimum slot duration is 30 minutes');
      return false;
    }
    
    if (duration > 480) {
      toast.error('Maximum slot duration is 8 hours');
      return false;
    }
    
    return true;
  };

  // Add time slot with real API
  const addTimeSlot = async () => {
    if (!validateTimeSlot(startTime, endTime)) return;
    
    const conflicts = checkConflicts(selectedDay, startTime, endTime);
    if (conflicts.length > 0) {
      setConflicts(conflicts);
      setShowConflicts(true);
      return;
    }
    
    setSaving(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = {
        day: selectedDay,
        start: startTime,
        end: endTime
      };

      if (typeof providerAPI.addScheduleSlot === 'function') {
        await providerAPI.addScheduleSlot(payload);
      } else if (typeof providerAPI.createSchedule === 'function') {
        await providerAPI.createSchedule(payload);
      } else {
        throw new Error('Add schedule API methods not available');
      }
      
      toast.success('Time slot added successfully');
      setShowAddModal(false);
      setStartTime('09:00');
      setEndTime('17:00');
      await fetchSchedule(false);
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add slot');
    } finally {
      setSaving(false);
    }
  };

  // Edit time slot with real API
  const editTimeSlot = async () => {
    if (!selectedSlot) return;
    if (!validateTimeSlot(startTime, endTime)) return;
    
    const conflicts = checkConflicts(selectedDay, startTime, endTime, selectedSlot.id);
    if (conflicts.length > 0) {
      setConflicts(conflicts);
      setShowConflicts(true);
      return;
    }
    
    setSaving(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const slotId = selectedSlot.id || selectedSlot._id;
      const payload = {
        start: startTime,
        end: endTime
      };

      if (typeof providerAPI.updateScheduleSlot === 'function') {
        await providerAPI.updateScheduleSlot(slotId, payload);
      } else if (typeof providerAPI.editSchedule === 'function') {
        await providerAPI.editSchedule(slotId, payload);
      } else {
        throw new Error('Update schedule API methods not available');
      }
      
      toast.success('Time slot updated successfully');
      setShowEditModal(false);
      setSelectedSlot(null);
      await fetchSchedule(false);
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update slot');
    } finally {
      setSaving(false);
    }
  };

  // Remove time slot with real API
  const removeTimeSlot = async (slotId) => {
    if (!slotId) return;
    if (!window.confirm('Are you sure you want to remove this time slot?')) return;
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.deleteScheduleSlot === 'function') {
        await providerAPI.deleteScheduleSlot(slotId);
      } else if (typeof providerAPI.removeSchedule === 'function') {
        await providerAPI.removeSchedule(slotId);
      } else {
        throw new Error('Delete schedule API methods not available');
      }
      
      toast.success('Slot removed successfully');
      await fetchSchedule(false);
    } catch (error) {
      console.error('Error removing slot:', error);
      toast.error(error.message || 'Failed to remove slot');
    }
  };

  // Add bulk time slots with real API
  const addBulkTimeSlots = async () => {
    if (bulkDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    
    if (!validateTimeSlot(bulkStart, bulkEnd)) return;
    
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const day of bulkDays) {
      const conflicts = checkConflicts(day, bulkStart, bulkEnd);
      if (conflicts.length > 0) {
        errorCount++;
        continue;
      }
      
      try {
        if (!providerAPI) {
          throw new Error('API service not available');
        }

        const payload = {
          day: day,
          start: bulkStart,
          end: bulkEnd
        };

        if (typeof providerAPI.addScheduleSlot === 'function') {
          await providerAPI.addScheduleSlot(payload);
        } else if (typeof providerAPI.createSchedule === 'function') {
          await providerAPI.createSchedule(payload);
        } else {
          throw new Error('Add schedule API methods not available');
        }
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }
    
    if (successCount > 0) {
      toast.success(`Added ${successCount} time slots successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to add ${errorCount} slots due to conflicts`);
    }
    
    setShowBulkModal(false);
    setBulkDays([]);
    await fetchSchedule(false);
    setSaving(false);
  };

  // Copy schedule from one day to another with real API
  const copySchedule = async (sourceDay, targetDay) => {
    const sourceSlots = schedule[sourceDay] || [];
    if (sourceSlots.length === 0) {
      toast.error('No slots to copy from selected day');
      return;
    }
    
    if (!window.confirm(`Copy schedule from ${sourceDay} to ${targetDay}? This will replace existing slots.`)) return;
    
    setSaving(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      // First remove existing slots for target day
      const existingSlots = schedule[targetDay] || [];
      for (const slot of existingSlots) {
        const slotId = slot.id || slot._id;
        if (typeof providerAPI.deleteScheduleSlot === 'function') {
          await providerAPI.deleteScheduleSlot(slotId);
        } else if (typeof providerAPI.removeSchedule === 'function') {
          await providerAPI.removeSchedule(slotId);
        }
      }
      
      // Add copied slots
      for (const slot of sourceSlots) {
        const payload = {
          day: targetDay,
          start: slot.start,
          end: slot.end
        };
        if (typeof providerAPI.addScheduleSlot === 'function') {
          await providerAPI.addScheduleSlot(payload);
        } else if (typeof providerAPI.createSchedule === 'function') {
          await providerAPI.createSchedule(payload);
        }
      }
      
      toast.success(`Schedule copied from ${sourceDay} to ${targetDay}`);
      await fetchSchedule(false);
    } catch (error) {
      console.error('Error copying schedule:', error);
      toast.error(error.message || 'Failed to copy schedule');
    } finally {
      setSaving(false);
    }
  };

  // Get total weekly hours
  const getTotalWeeklyHours = () => {
    let totalMinutes = 0;
    Object.values(schedule).forEach(daySlots => {
      daySlots.forEach(slot => {
        const start = parse(slot.start, 'HH:mm', new Date());
        const end = parse(slot.end, 'HH:mm', new Date());
        totalMinutes += differenceInMinutes(end, start);
      });
    });
    return (totalMinutes / 60).toFixed(1);
  };

  // Get day status
  const getDayStatus = (day) => {
    const slots = schedule[day] || [];
    if (slots.length === 0) return { variant: 'danger', text: 'Unavailable' };
    if (slots.length > 0) return { variant: 'success', text: 'Available' };
    return { variant: 'warning', text: 'Partial' };
  };

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  const totalHours = getTotalWeeklyHours();

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchSchedule(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Work Schedule</h2>
            <p className="text-muted mb-0">
              Manage your weekly availability and working hours
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="d-flex align-items-center gap-2"
            >
              <FaSync className={autoRefresh ? 'spin' : ''} />
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowBulkModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaCopy />
              Bulk Add
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Weekly Hours</p>
                    <h2 className="fw-bold mb-0">{totalHours} hrs</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#667eea20' }}>
                    <FaRegClock size={24} color="#667eea" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Active Days</p>
                    <h2 className="fw-bold mb-0">
                      {Object.values(schedule).filter(day => day && day.length > 0).length}/7
                    </h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaCalendarAlt size={24} color="#10b981" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Slots</p>
                    <h2 className="fw-bold mb-0">
                      {Object.values(schedule).reduce((sum, day) => sum + (day ? day.length : 0), 0)}
                    </h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaClock size={24} color="#f59e0b" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Last Updated</p>
                    <h6 className="fw-bold mb-0">
                      {lastUpdated ? format(lastUpdated, 'hh:mm a') : 'Never'}
                    </h6>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaBell size={24} color="#3b82f6" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Schedule Grid */}
        <Row className="g-4">
          {days.map(day => {
            const daySlots = schedule[day.key] || [];
            const status = getDayStatus(day.key);
            
            return (
              <Col key={day.key} lg={6} xl={4}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                  <Card.Header 
                    className="border-0 py-3 px-4 d-flex justify-content-between align-items-center"
                    style={{ background: 'white' }}
                  >
                    <div>
                      <h5 className="fw-bold mb-0">{day.label}</h5>
                      <Badge bg={status.variant} className="mt-1">
                        {status.text}
                      </Badge>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedDay(day.key);
                          setStartTime('09:00');
                          setEndTime('17:00');
                          setShowAddModal(true);
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaPlus size={12} />
                        Add
                      </Button>
                      {daySlots.length > 0 && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            const copyFrom = window.prompt(
                              `Copy schedule from which day?\nAvailable: ${days.map(d => d.label).join(', ')}`,
                              ''
                            );
                            if (copyFrom) {
                              const sourceDay = days.find(d => d.label.toLowerCase() === copyFrom.toLowerCase());
                              if (sourceDay) {
                                copySchedule(sourceDay.key, day.key);
                              } else {
                                toast.error('Invalid day name');
                              }
                            }
                          }}
                          className="d-flex align-items-center gap-1"
                        >
                          <FaCopy size={12} />
                          Copy
                        </Button>
                      )}
                    </div>
                  </Card.Header>
                  
                  <Card.Body className="p-4">
                    {daySlots.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {daySlots.map(slot => {
                          const slotId = slot.id || slot._id;
                          return (
                            <div
                              key={slotId}
                              className="d-flex justify-content-between align-items-center p-3 border rounded-3"
                              style={{ background: '#f8fafc', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div className="text-primary">
                                  <FaClock size={18} />
                                </div>
                                <div>
                                  <span className="fw-semibold">{slot.start}</span>
                                  <span className="text-muted mx-2">–</span>
                                  <span className="fw-semibold">{slot.end}</span>
                                  <div className="small text-muted">
                                    Duration: {differenceInMinutes(
                                      parse(slot.end, 'HH:mm', new Date()),
                                      parse(slot.start, 'HH:mm', new Date())
                                    )} mins
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setSelectedDay(day.key);
                                    setStartTime(slot.start);
                                    setEndTime(slot.end);
                                    setShowEditModal(true);
                                  }}
                                  className="text-primary p-1"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => removeTimeSlot(slotId)}
                                  className="text-danger p-1"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <FaRegClock size={48} className="text-muted mb-3 opacity-50" />
                        <p className="text-muted mb-0">No time slots added</p>
                        <p className="text-muted small">Click "Add" to set your availability</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Add Time Slot Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              <FaPlus className="me-2" />
              Add Time Slot
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
              <div className="d-flex gap-2">
                <FaClock size={20} />
                <div>
                  <strong>Adding slot for {selectedDay}</strong>
                  <p className="mb-0 small">Slots cannot overlap. Minimum duration: 30 minutes</p>
                </div>
              </div>
            </Alert>

            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Start Time</Form.Label>
                <Form.Select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">End Time</Form.Label>
                <Form.Select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeSlots.filter(time => time > startTime).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addTimeSlot}
              disabled={saving}
              className="d-flex align-items-center gap-2"
            >
              {saving ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <FaSave size={16} />
              )}
              {saving ? 'Adding...' : 'Add Slot'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Time Slot Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              <FaEdit className="me-2" />
              Edit Time Slot
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Start Time</Form.Label>
                <Form.Select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">End Time</Form.Label>
                <Form.Select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeSlots.filter(time => time > startTime).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editTimeSlot}
              disabled={saving}
              className="d-flex align-items-center gap-2"
            >
              {saving ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <FaSave size={16} />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Bulk Add Modal */}
        <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered size="lg">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              <FaCopy className="me-2" />
              Bulk Add Time Slots
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
              Add the same time slot to multiple days at once
            </Alert>

            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Select Days</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  {days.map(day => (
                    <Form.Check
                      key={day.key}
                      type="checkbox"
                      label={day.label}
                      checked={bulkDays.includes(day.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkDays([...bulkDays, day.key]);
                        } else {
                          setBulkDays(bulkDays.filter(d => d !== day.key));
                        }
                      }}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Start Time</Form.Label>
                <Form.Select
                  value={bulkStart}
                  onChange={(e) => setBulkStart(e.target.value)}
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">End Time</Form.Label>
                <Form.Select
                  value={bulkEnd}
                  onChange={(e) => setBulkEnd(e.target.value)}
                >
                  {timeSlots.filter(time => time > bulkStart).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addBulkTimeSlots}
              disabled={saving || bulkDays.length === 0}
              className="d-flex align-items-center gap-2"
            >
              {saving ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <FaPlus size={16} />
              )}
              {saving ? 'Adding...' : `Add to ${bulkDays.length} day${bulkDays.length !== 1 ? 's' : ''}`}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Conflict Warning Modal */}
        <Modal show={showConflicts} onHide={() => setShowConflicts(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold text-warning">
              <FaExclamationTriangle className="me-2" />
              Time Slot Conflict
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            <Alert variant="warning">
              <strong>The following time slots conflict with your new slot:</strong>
              <ul className="mt-2 mb-0">
                {conflicts.map(conflict => {
                  const conflictId = conflict.id || conflict._id;
                  return (
                    <li key={conflictId}>
                      {conflict.start} – {conflict.end}
                    </li>
                  );
                })}
              </ul>
            </Alert>
            <p className="text-muted small mt-3">
              Please choose a different time or remove the conflicting slots first.
            </p>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="primary" onClick={() => setShowConflicts(false)}>
              Got it
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProviderSchedule;