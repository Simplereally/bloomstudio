/**
 * Error utilities barrel export
 */

export {
    PollinationsApiError,
    isPollinationsApiError,
    isErrorWithMessage,
    getErrorMessage,
    isBadRequestError,
    isUnauthorizedError,
    isInternalError,
    isApiError,
    isApiErrorCode,
    isClientErrorCode,
    ApiErrorCodeConst,
    ClientErrorCodeConst,
    ClientErrorCodeConst as ClientErrorCode,
    AllErrorCodes,
    ERROR_MESSAGES,
    type PollinationsErrorDetails,
    type ValidationErrorDetails,
    type ApiErrorCode,
    type ClientErrorCode as ClientErrorCodeType,
    type ErrorCode,
} from "./pollinations-error"

export {
    showErrorToast,
    showSuccessToast,
    showInfoToast,
    showLoadingToast,
    updateToastSuccess,
    updateToastError,
    dismissToast,
    showRateLimitToast,
    showAuthRequiredToast,
    createToastErrorHandler,
} from "./toast-errors"
