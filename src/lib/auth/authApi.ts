import { DEMO_MODE } from '../../demo/config';
import * as real from './authApi.real';
import * as demo from '../../demo/api/authApi.mock';

export const forgotPassword: typeof real.forgotPassword = DEMO_MODE ? demo.forgotPassword : real.forgotPassword;
export const resetPassword: typeof real.resetPassword = DEMO_MODE ? demo.resetPassword : real.resetPassword;
