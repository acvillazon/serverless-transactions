const validateFields = function (body) {
  const { amount, quantity, name } = body;
  let bodyErrors = "";

  if (!name) {
    bodyErrors += "Product name is required\n";
  }

  if (!amount) {
    bodyErrors += "Amount is required\n";
  }

  if (!quantity) {
    bodyErrors += "Quantity is required\n";
  }

  return bodyErrors;
};

const validateFieldsTransfer = function (body) {
  const { amount, target } = body;
  let bodyErrors = "";

  if (!target) {
    bodyErrors += "Target is required\n";
  }

  if (!amount) {
    bodyErrors += "Amount is required\n";
  }

  return bodyErrors;
};

module.exports = {
  validateFields,
  validateFieldsTransfer
};
