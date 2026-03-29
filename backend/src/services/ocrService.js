async function processReceipt(file) {
  if (!file) {
    return null;
  }

  return {
    merchant: "",
    total: null,
    date: "",
    categoryHint: "",
    rawText: "OCR placeholder: integrate a real OCR provider here."
  };
}

module.exports = {
  processReceipt
};
