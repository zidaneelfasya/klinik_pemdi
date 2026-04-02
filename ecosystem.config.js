module.exports = {
  apps: [
    {
      name: "klinikpemdig",
      script: "npm",
      args: "start",
      env: {
        PORT: 3005,
        NODE_ENV: "production"
      }
    }
  ]
}