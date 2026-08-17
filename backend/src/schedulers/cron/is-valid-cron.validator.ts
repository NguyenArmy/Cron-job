import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { CronExpressionParser } from 'cron-parser';

@ValidatorConstraint({ name: 'isValidCron', async: false })
export class IsValidCronConstraint
    implements ValidatorConstraintInterface {
    validate(value: unknown, args: ValidationArguments): boolean {

        if (typeof value !== 'string' || !value.trim()) {
            return true;
        }

        const dto = args.object as { timezone?: string };
        const timezone = dto.timezone?.trim() || 'Asia/Ho_Chi_Minh';

        try {
            CronExpressionParser.parse(value.trim(), {
                currentDate: new Date(),
                tz: timezone,
            });

            return true;
        } catch {
            return false;
        }
    }

    defaultMessage(): string {
        return 'Biểu thức cron hoặc timezone không hợp lệ';
    }
}
export function IsValidCron(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return (object: object, propertyName: string | symbol) => {
        registerDecorator({
            name: 'isValidCron',
            target: object.constructor,
            propertyName: propertyName as string,
            options: validationOptions,
            validator: IsValidCronConstraint,
        });
    };
}