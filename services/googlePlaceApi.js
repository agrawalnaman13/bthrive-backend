const axios = require("axios");

async function getSuggestionFromGoogle(req, res) {
  try {
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${req.params.place}&key=AIzaSyCuDtnfMbAA_Vf55k2ew9jn1QVmkTvnlT4`
    );

    return res.send(await JSON.stringify(data));
  } catch (error) {
    if (error.response) return { error };
  }
}

module.exports = getSuggestionFromGoogle;
