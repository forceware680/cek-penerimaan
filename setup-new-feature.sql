/* 
   SQL Script for "Request Kode Barang" Feature
   Execute this in DBKOP database 
*/

-- 1. Table for Item Code Requests
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Req_KodeBarang]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Req_KodeBarang] (
        [RequestID] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(50) NOT NULL,
        [OPDName] NVARCHAR(255),
        [ObjekRSSub] NVARCHAR(50) NOT NULL, -- Account code (1.1.7...)
        [StaID] NVARCHAR(10) NOT NULL,      -- 'PLU' or 'NON'
        [IDPLU_Req] NVARCHAR(50),           -- Optional for PLU
        [Keterangan] NVARCHAR(MAX),
        [Satuan] NVARCHAR(50),
        [Status] NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
        [CatatanAdmin] NVARCHAR(MAX),
        [CreatedAt] DATETIME DEFAULT GETDATE(),
        [UpdatedAt] DATETIME DEFAULT GETDATE(),
        [ApprovedAt] DATETIME,
        [ApprovedBy] NVARCHAR(50)
    );
END
GO

-- 2. Table for Notifications
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sys_Notification]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Sys_Notification] (
        [NotificationID] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(50) NOT NULL, -- Target user
        [Message] NVARCHAR(MAX) NOT NULL,
        [IsRead] BIT DEFAULT 0,
        [CreatedAt] DATETIME DEFAULT GETDATE()
    );
END
GO
