require('fh-wfm-file/lib/cloud')(mediator, app);

```

### Exposed endpoints

Base url : `/file/wfm`

| resource | method | returns |
| -------- | ------ | ------- |
| /all | GET | array of files |
| /owner/:owner | GET | filtered array of files |
| /owner/:owner/upload/base64/:filename | POST | file metadata |
| /upload/binary | POST | file metadata  |


#### File metadata structure

```
   {
      owner: req.params.owner,
      name: req.params.filename,
      uid: uuid.create().toString()
   }

```

## Supported storage engines

By default file module would store files in filesystem temporary folder.

### AWS S3 storage

Allows to store files in AWS S3 buckets.

Options:

```
var storageConfig = {
  s3: {
    s3Options: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_ACCESS_KEY_SECRET,
      region: process.env.AWS_S3_REGION
    },
    bucket: "raincatcher-files"
  }
}
require('fh-wfm-file/lib/cloud')(mediator, storageConfig);
```

### Gridfs MongoDB storage

Allows to store file in MongoDB database using Gridfs driver

Options:
```
var storageConfig = {
  gridFs: {
    mongoUrl: "mongodb://localhost:27017/files"
  }
};
require('fh-wfm-file/lib/cloud')(mediator, storageConfig);
```
