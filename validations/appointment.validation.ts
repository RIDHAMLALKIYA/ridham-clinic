export const validatePhoneNumber = (phoneNumber: string) => {
  return /^[0-9]{10}$/.test(phoneNumber);
};

export const appointmentSchema = {
  phoneNumber: validatePhoneNumber,
};
