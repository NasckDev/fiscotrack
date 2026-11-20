import { Form } from 'antd';
import type { FormInstance, FormProps, Rule } from 'antd/es/form';
import type { FormItemProps } from 'antd/es/form/FormItem';
import type { ReactNode } from 'react';

export type AppFormInstance<Values = unknown> = FormInstance<Values>;
export type AppFormRule = Rule;

/** Instância do formulário, para ler, limpar e marcar erros por campo. */
export function useAppForm<Values = unknown>(): [AppFormInstance<Values>] {
  const [form] = Form.useForm<Values>();
  return [form];
}

interface AppFormProps<Values> {
  readonly form?: AppFormInstance<Values>;
  readonly name?: string;
  readonly initialValues?: FormProps<Values>['initialValues'];
  readonly onFinish?: (values: Values) => void | Promise<void>;
  readonly disabled?: boolean;
  readonly layout?: 'vertical' | 'horizontal';
  readonly children: ReactNode;
}

/** Formulário com rótulos acima dos campos, validação por regra e foco no primeiro erro. */
export function AppForm<Values = unknown>({ layout = 'vertical', ...props }: AppFormProps<Values>) {
  return (
    <Form<Values>
      {...props}
      layout={layout}
      requiredMark={false}
      scrollToFirstError={{ focus: true, block: 'center' }}
      autoComplete="off"
    />
  );
}

export interface AppFormItemProps {
  readonly name?: FormItemProps['name'];
  readonly label?: ReactNode;
  readonly rules?: readonly AppFormRule[];
  readonly help?: ReactNode;
  readonly extra?: ReactNode;
  readonly required?: boolean;
  readonly valuePropName?: string;
  readonly validateTrigger?: FormItemProps['validateTrigger'];
  readonly htmlFor?: string;
  readonly validateStatus?: 'error' | 'warning' | 'success';
  /** Ajusta o valor digitado antes de guardá-lo (por exemplo, caixa alta). */
  readonly normalize?: (value: string) => string;
  readonly children: ReactNode;
}

export function AppFormItem({ rules, ...props }: AppFormItemProps) {
  return <Form.Item {...props} rules={rules ? [...rules] : undefined} />;
}
