const BACKEND_URL = 'http://127.0.0.1:5000/api';

/**
 * Helper to dynamically call any pybaseball function from the Flask backend
 * @param {string} functionName - The exact pybaseball function name
 * @param {object} args - Key-value pairs of arguments to pass to the function
 */
export async function fetchPybaseball(functionName, args = {}) {
	try {
		const response = await fetch(`${BACKEND_URL}/${functionName}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(args)
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Backend request failed');
		}

		return await response.json();
	} catch (error) {
		console.error(`Error fetching ${functionName}:`, error);
		throw error;
	}
}
