import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSurname, setEmployeeSurname] = useState('');
  const [employeeImage, setEmployeeImage] = useState('');
  const [loading, setLoading] = useState({
    groups: false,
    employees: false,
    attendances: false,
    createGroup: false,
    addEmployee: false
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchGroups(),
      fetchEmployees(),
      fetchAttendances()
    ]);
  };

  const fetchGroups = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(prev => ({ ...prev, groups: true }));
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch groups');
      }

      // Ensure data is always an array
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups. Please try again.');
      setGroups([]);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(prev => ({ ...prev, employees: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employees');
      }

      // Ensure data is always an array
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  };

  const fetchAttendances = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(prev => ({ ...prev, attendances: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      // Ensure data is always an array
      setAttendances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance. Please try again.');
      setAttendances([]);
    } finally {
      setLoading(prev => ({ ...prev, attendances: false }));
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(prev => ({ ...prev, createGroup: true }));
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName.trim() })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      setNewGroupName('');
      await fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, createGroup: false }));
    }
  };

  const addEmployee = async () => {
    if (!employeeName.trim() || !employeeSurname.trim() || !selectedGroup || !employeeImage) {
      setError('All fields are required to add an employee');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(prev => ({ ...prev, addEmployee: true }));
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: employeeName.trim(),
          surname: employeeSurname.trim(),
          groupId: selectedGroup,
          image: employeeImage
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add employee');
      }

      setEmployeeName('');
      setEmployeeSurname('');
      setEmployeeImage('');
      setSelectedGroup('');
      await fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      setError(error.message || 'Failed to add employee. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, addEmployee: false }));
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setEmployeeImage(imageData);
        stream.getTracks().forEach(track => track.stop());
      };
    }).catch(error => {
      console.error('Error accessing camera:', error);
      setError('Could not access camera. Please check permissions.');
    });
  };

  const exportToExcel = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to export attendance data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export attendance data. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Company Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Groups */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Groups</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="New group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
                disabled={loading.createGroup}
              />
              <button
                onClick={createGroup}
                disabled={loading.createGroup || !newGroupName.trim()}
                className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
              >
                {loading.createGroup ? 'Creating...' : 'Create Group'}
              </button>
            </div>
            {loading.groups ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading groups...</p>
              </div>
            ) : (
              <ul>
                {groups.length > 0 ? (
                  groups.map(group => (
                    <li key={group._id} className="mb-2 p-2 bg-gray-50 rounded">
                      {group.name}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No groups found</p>
                )}
              </ul>
            )}
          </div>

          {/* Employees */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
              disabled={loading.groups}
            >
              <option value="">Select Group</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
              disabled={loading.addEmployee}
            />
            <input
              type="text"
              placeholder="Surname"
              value={employeeSurname}
              onChange={(e) => setEmployeeSurname(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
              disabled={loading.addEmployee}
            />
            <button
              onClick={captureImage}
              disabled={loading.addEmployee}
              className="w-full mb-2 bg-green-500 text-white p-2 rounded disabled:bg-gray-300 hover:bg-green-600 transition-colors"
            >
              Capture Face
            </button>
            <button
              onClick={addEmployee}
              disabled={loading.addEmployee || !employeeName.trim() || !employeeSurname.trim() || !selectedGroup || !employeeImage}
              className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
            >
              {loading.addEmployee ? 'Adding...' : 'Add Employee'}
            </button>
          </div>

          {/* Attendance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Attendance</h2>
            <button
              onClick={exportToExcel}
              className="mb-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
            >
              Export to CSV
            </button>
            {loading.attendances ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading attendance...</p>
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {attendances.length > 0 ? (
                  attendances.slice(0, 10).map(att => (
                    <li key={att._id} className="mb-2 p-2 bg-gray-50 rounded">
                      {att.employeeId?.name} {att.employeeId?.surname} - {new Date(att.entryTime).toLocaleString()}
                      {att.exitTime && ` - ${new Date(att.exitTime).toLocaleString()}`}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No attendance records found</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
