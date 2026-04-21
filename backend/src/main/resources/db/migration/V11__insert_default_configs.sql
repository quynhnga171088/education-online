INSERT INTO system_configs (key, value, description) VALUES
    ('COMPLETION_MODE',       'OPEN',              'Chế độ hoàn thành bài học: OPEN = mở là xong, VIDEO_50 = phải xem 50% video'),
    ('MAX_VIDEO_SIZE_MB',     '2048',              'Giới hạn kích thước file video upload (MB)'),
    ('MAX_DOCUMENT_SIZE_MB',  '50',                'Giới hạn kích thước file tài liệu upload (MB)'),
    ('ALLOWED_VIDEO_TYPES',   'mp4,mov,webm,avi',  'Định dạng video được phép upload'),
    ('ALLOWED_DOC_TYPES',     'pdf,docx,xlsx,pptx,txt', 'Định dạng tài liệu được phép upload');

INSERT INTO bank_info (id, bank_name, account_number, account_name, branch, transfer_template)
VALUES (1, 'Vietcombank', '1234567890', 'NGUYEN VAN A', 'Chi nhánh Hà Nội', 'LMS [MaHV] [TenKhoa]')
ON CONFLICT (id) DO NOTHING;
