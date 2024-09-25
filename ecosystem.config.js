module.exports = {
  apps: [
    {
      name: "backend",
      exec_mode: "cluster",
      instances: "max",
      script: "src/index.ts",
      env_production: {
        ENVIRONMENT: "production",
      },
      env_development: {
        ENVIRONMENT: "development",
      },
    },
  ],
};
