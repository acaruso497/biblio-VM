module.exports = (req, res) => {
  res.status(200).json({ messaggio: '🏛️ Il server della biblioteca è attivo su Vercel!' });
};
