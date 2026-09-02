const errorHandler = (error, req, res, next) => {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    code: error.code || "SERVER_ERROR",
  });
};

export default errorHandler;