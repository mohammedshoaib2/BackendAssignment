const validateEmail = (email) => {
  const regexForEmail = /[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}/;
  const isValid = regexForEmail.test(email);
  return isValid;
};

export { validateEmail };
