export default async function handler(req, res) {
  try {
    /*
     * Discord checking code goes here.
     *
     * IMPORTANT:
     * Do NOT put the Discord secret in script.js.
     *
     * Environment variables belong here instead.
     */

    const status = "offline";

    res.status(200).json({
      status: status,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "offline",
    });
  }
}
