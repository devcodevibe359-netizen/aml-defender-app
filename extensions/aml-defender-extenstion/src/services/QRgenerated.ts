export const QRgenerated  = async ({ token , orderNumber}: { token: string ,  orderNumber: string | null; }) => {
  try {
    const res = await fetch(
      'https://aml-defender-app-production.up.railway.app/api/generate-qr',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'app_home_qr',
          orderDetails: orderNumber
        }),
      }
    );
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};