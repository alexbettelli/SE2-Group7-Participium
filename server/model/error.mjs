class AppError extends Error {
    constructor(code, name, message){
        super(message);
        this.code = code;
        this.name = name;
        this.message = message;
    }

    toJSON() {
        return {
            code: this.code,
            name: this.name,
            message: this.message,
        };
  }
}

class BadRequestError extends AppError {
    constructor(message = "Invalid body"){
        super(400, "Bad Request", message);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = "You are not authenticated."){
        super(401, "Unauthorized Error", message);
    }
}

class ForbiddenError extends AppError {
    constructor(message = "You are not allowed to do this operation."){
        super(403, "Forbidden", message);
    }
}

class ConflictError extends AppError {
    constructor(message = "Conflict on the resource."){
        super(409, "Conflict Error", message);
    }
}

class InternalServerError extends AppError {
    constructor(message = "An unexpected error occurred."){
        super(500, "Internal Server Error", message);
    }
}

class ServiceUnvailableError extends AppError {
    constructor(message = "The service is temporarly unvailable") {
        super(503, "Service Unvailable", message);
    }
}


export { AppError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, InternalServerError, ServiceUnvailableError }