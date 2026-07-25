  const formatdate = (date, fallback = '-') =>
  date
    ? new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      
      })
    : fallback;

export default formatdate