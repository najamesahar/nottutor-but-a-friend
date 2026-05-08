// Function definitions
function addNotification(notification) {
  const container = document.getElementById('notifications');
  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = notification.message || 'No message';
  if (!notification.isRead) {
    const button = document.createElement('button');
    button.textContent = 'Mark as Read';
    button.onclick = () => markAsRead(notification._id);
    div.appendChild(button);
  }
  container.prepend(div);
  if (container.children.length > 5) {
    container.removeChild(container.lastChild);
  }
}

function checkAuth() {
  fetch('/auth/status')
    .then(res => res.json())
    .then(data => {
      console.log('Auth status:', data);
      if (data.authenticated) {
        localStorage.setItem('userId', data.user._id);
        document.getElementById('login').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadNotifications();
        loadClasses();
      } else {
        document.getElementById('login').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
      }
    })
    .catch(err => {
      console.error('Auth check error:', err);
      document.getElementById('login').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';
    });
}

function loadNotifications() {
  fetch('/api/notifications/unread/' + localStorage.getItem('userId'))
    .then(res => res.json())
    .then(notifications => {
      console.log('Notifications fetched:', notifications);
      const container = document.getElementById('notifications');
      container.innerHTML = '';
      if (Array.isArray(notifications)) {
        notifications.forEach(n => {
          const div = document.createElement('div');
          div.className = 'notification';
          div.textContent = n.message || 'No message';
          const button = document.createElement('button');
          button.textContent = 'Mark as Read';
          button.onclick = () => markAsRead(n._id);
          div.appendChild(button);
          container.prepend(div);
        });
      } else {
        console.error('Notifications is not an array:', notifications);
      }
    })
    .catch(err => console.error('Notifications error:', err));
}

function loadClasses() {
  fetch('/api/classes/available')
    .then(res => res.json())
    .then(data => {
      console.log('Classes data received:', data); // Debug log
      if (data.error) {
        console.error('Error loading classes:', data.error);
        return;
      }
      const container = document.getElementById('classes');
      container.innerHTML = '';
      if (Array.isArray(data)) {
        data.forEach(c => {
          const div = document.createElement('div');
          div.className = 'class-card';
          const info = document.createElement('span');
          info.textContent = `${c.title} by ${c.tutor?.name || 'No tutor'} (Booked: ${c.bookedBy}/${c.maxStudents}) - ${new Date(c.schedule.startTime).toLocaleString()} to ${new Date(c.schedule.endTime).toLocaleString()}`;
          div.appendChild(info);
          const studentId = localStorage.getItem('userId');
          if (c.bookedBy.includes(studentId)) {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel Booking';
            cancelButton.onclick = () => cancelClass(c._id);
            div.appendChild(cancelButton);
          } else {
            const bookButton = document.createElement('button');
            bookButton.textContent = 'Book Class';
            bookButton.onclick = () => bookClass(c._id);
            div.appendChild(bookButton);
          }
          container.appendChild(div);
        });
      } else {
        console.error('Unexpected data format:', data);
      }
    })
    .catch(err => console.error('Classes fetch error:', err));
}

function searchClasses() {
  const query = document.getElementById('classSearch').value;
  fetch(`/api/classes/search?q=${query}`)
    .then(res => res.json())
    .then(data => {
      console.log('Search data received:', data); // Debug log
      if (data.error) {
        console.error('Error searching classes:', data.error);
        return;
      }
      const container = document.getElementById('searchResults');
      container.innerHTML = '';
      if (Array.isArray(data)) {
        data.forEach(c => {
          const div = document.createElement('div');
          div.className = 'search-result';
          const info = document.createElement('span');
          info.textContent = `${c.title} by ${c.tutor?.name || 'No tutor'} (Booked: ${c.bookedBy}/${c.maxStudents}) - ${new Date(c.schedule.startTime).toLocaleString()} to ${new Date(c.schedule.endTime).toLocaleString()}`;
          div.appendChild(info);
          const studentId = localStorage.getItem('userId');
          if (c.bookedBy.includes(studentId)) {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel Booking';
            cancelButton.onclick = () => cancelClass(c._id);
            div.appendChild(cancelButton);
          } else {
            const bookButton = document.createElement('button');
            bookButton.textContent = 'Book Class';
            bookButton.onclick = () => bookClass(c._id);
            div.appendChild(bookButton);
          }
          container.appendChild(div);
        });
      } else {
        console.error('Unexpected search data format:', data);
      }
    })
    .catch(err => console.error('Search fetch error:', err));
}

function bookClass(classId) {
  const studentId = localStorage.getItem('userId');
  fetch(`/api/classes/${classId}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Book class response:', data);
      if (data.error) {
        alert(data.error);
      } else {
        loadClasses();
        loadNotifications();
        alert(data.message);
      }
    })
    .catch(err => console.error('Book class error:', err));
}

function cancelClass(classId) {
  const studentId = localStorage.getItem('userId');
  fetch(`/api/classes/${classId}/cancel`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Cancel class response:', data);
      if (data.error) {
        alert(data.error);
      } else {
        loadClasses();
        loadNotifications();
        alert(data.message);
      }
    })
    .catch(err => console.error('Cancel class error:', err));
}

function markAsRead(notificationId) {
  fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(data => {
      console.log('Mark as read response:', data);
      loadNotifications(); // Refresh the list
    })
    .catch(err => console.error('Mark as read error:', err));
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    fetch('/auth/logout')
      .then(() => {
        localStorage.removeItem('userId');
        document.getElementById('login').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
      });
  }
}

const eventSource = new EventSource('/api/notifications/stream/unread/' + (localStorage.getItem('userId') || ''));
eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New SSE notification:', notification);
  addNotification(notification);
};

function showClassDetails(classId) {
  fetch(`/api/classes/${classId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      alert(`Class: ${data.title}\nTutor: ${data.tutor.name} (${data.tutor.email})\nBooked: ${data.bookedBy}/${data.maxStudents}\nTime: ${new Date(data.schedule.startTime).toLocaleString()} to ${new Date(data.schedule.endTime).toLocaleString()}`);
    })
    .catch(err => console.error('Class details fetch error:', err));
}

// Initialize with a small delay to ensure session is loaded after Google OAuth redirect
setTimeout(checkAuth, 100);
