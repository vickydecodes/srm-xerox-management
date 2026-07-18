import { toast } from 'sonner';
import { camelToTitle } from '../utils/helper.utils';

const STATUS_DEFAULTS = {
    400: 'Bad request.',
    401: 'Unauthorized. Please log in again.',
    403: 'You do not have permission for this action.',
    404: 'Requested resource not found.',
    422: 'Validation failed. Check your input.',
    429: 'Too many requests. Please slow down.',
    500: 'Server error. Please try again later.',
    503: 'Service unavailable. Try again later.',
};

const handleApiError = (
    err,
    fallbackMessage = 'Something went wrong!',
    options = {}
) => {
    const { toast: showToast = true, silent = false } = options;

    if (!silent) {
        console.group('🚨 API Error');
        console.error(err);
        console.groupEnd();
    }

    const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        null;

    const notify = (message) => {
        if (showToast) toast.error(camelToTitle(message));
    };

    if (err?.code === 'ERR_NETWORK') {
        const msg = 'Network error — check your internet connection.';
        notify(msg);
        return msg;
    }

    if (err?.code === 'ECONNABORTED') {
        const msg = 'Request timed out. Try again.';
        notify(msg);
        return msg;
    }

    const status = err?.response?.status;
    const message = serverMessage || STATUS_DEFAULTS[status] || fallbackMessage;

    notify(message);
    return message;
};

export default handleApiError;