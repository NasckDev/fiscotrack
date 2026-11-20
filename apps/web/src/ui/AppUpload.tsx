import { Upload } from 'antd';
import { AppIcon } from './AppIcon';
import { AppText } from './AppTypography';

interface AppUploadProps {
  /** Recebe o arquivo escolhido; nada é enviado a servidores. */
  readonly onFile: (file: File) => void;
  readonly accept?: string;
  readonly title: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

/** Área de arrastar e soltar. O arquivo é lido no navegador (sem envio). */
export function AppUpload({ onFile, accept, title, description, disabled }: AppUploadProps) {
  return (
    <Upload.Dragger
      accept={accept}
      multiple={false}
      maxCount={1}
      showUploadList={false}
      disabled={disabled}
      beforeUpload={(file) => {
        onFile(file);
        return false;
      }}
      style={{ padding: '24px 8px' }}
    >
      <p style={{ fontSize: 40, margin: 0 }}>
        <AppIcon name="upload" />
      </p>
      <p style={{ margin: '8px 0 4px', fontWeight: 700, fontSize: 16 }}>{title}</p>
      {description !== undefined && <AppText type="secondary">{description}</AppText>}
    </Upload.Dragger>
  );
}
