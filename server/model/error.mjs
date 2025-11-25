class AppError extends Error {
    constructor(code, name, error){
        super(error);
        this.code = code;
        this.name = name;
        this.error = error;
    }

    toJSON() {
        return {
            code: this.code,
            name: this.name,
            error: this.error,
        };
  }
}

class BadRequestError extends AppError {
    constructor(error = "Invalid body"){
        super(400, "Bad Request", error);
    }
}

class UnauthorizedError extends AppError {
    constructor(error = "You are not authenticated."){
        super(401, "Unauthorized Error", error);
    }
}

class ForbiddenError extends AppError {
    constructor(error = "You are not allowed to do this operation."){
        super(403, "Forbidden", error);
    }
}

class ConflictError extends AppError {
    constructor(error = "Conflict on the resource."){
        super(409, "Conflict Error", error);
    }
}

class InternalServerError extends AppError {
    constructor(error = "An unexpected error occurred."){
        super(500, "Internal Server Error", error);
    }
}

class ServiceUnvailableError extends AppError {
    constructor(error = "The service is temporarly unvailable") {
        super(503, "Service Unvailable", error);
    }
}


export { AppError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, InternalServerError, ServiceUnvailableError }