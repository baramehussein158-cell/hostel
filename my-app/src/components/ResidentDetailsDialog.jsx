import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  ADMIN_UPDATE_ACCESS_LABELS,
  APPLICATION_STATUS_LABELS,
  GENDER_OPTIONS,
  PAYMENT_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  buildProfileImageSrc,
  formatCurrency,
} from '../data/portalData';

const getGenderLabel = (gender) => GENDER_OPTIONS.find((option) => option.value === gender)?.label || gender || 'Not set';

const ResidentDetailsDialog = ({ open, student, latestApplication, onClose }) => {
  const profileImageSrc = buildProfileImageSrc(student?.profileImageUrl, student?.profileImageUpdatedAt);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="resident-details-dialog">
      <DialogTitle>Resident details</DialogTitle>
      <DialogContent dividers>
        {student ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={2} className="resident-summary">
                {profileImageSrc ? (
                  <Box
                    component="img"
                    src={profileImageSrc}
                    alt={`${student.name} profile`}
                    className="resident-image"
                  />
                ) : (
                  <Avatar className="resident-avatar">{student.name?.charAt(0)?.toUpperCase()}</Avatar>
                )}

                <div>
                  <Typography variant="h6">{student.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </div>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={student.campus || 'Campus not set'} size="small" />
                  <Chip label={getGenderLabel(student.gender)} size="small" variant="outlined" />
                  <Chip
                    label={ADMIN_UPDATE_ACCESS_LABELS[String(Boolean(student.allowAdminUpdates))]}
                    size="small"
                    color={student.allowAdminUpdates ? 'success' : 'default'}
                  />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <div>
                  <Typography variant="overline">Account details</Typography>
                  <Grid container spacing={2} className="resident-grid">
                    <Grid item xs={12} sm={6}>
                      <strong>Registration number</strong>
                      <span>{student.regNumber || 'Not set'}</span>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <strong>Phone</strong>
                      <span>{student.phone || 'Not set'}</span>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <strong>Joined</strong>
                      <span>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <strong>Profile updated</strong>
                      <span>
                        {student.profileImageUpdatedAt
                          ? new Date(student.profileImageUpdatedAt).toLocaleDateString()
                          : 'No upload yet'}
                      </span>
                    </Grid>
                  </Grid>
                </div>

                <Divider />

                <div>
                  <Typography variant="overline">Latest application</Typography>
                  {latestApplication ? (
                    <Stack spacing={1.25} className="resident-application-card">
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip
                          label={APPLICATION_STATUS_LABELS[latestApplication.status]}
                          color={latestApplication.status === 'approved' ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={PAYMENT_STATUS_LABELS[latestApplication.paymentStatus ?? 'pending']}
                          color={latestApplication.paymentStatus === 'verified' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Grid container spacing={1.5} className="resident-grid">
                        <Grid item xs={12} sm={6}>
                          <strong>Room type</strong>
                          <span>{ROOM_TYPE_LABELS[latestApplication.roomType] || latestApplication.roomType}</span>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <strong>Assigned room</strong>
                          <span>{latestApplication.assignedRoom || 'Not assigned yet'}</span>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <strong>Amount paid</strong>
                          <span>{formatCurrency(latestApplication.amountPaid)}</span>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <strong>Expected rent</strong>
                          <span>{formatCurrency(latestApplication.expectedRentAmount)}</span>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <strong>Payment reference</strong>
                          <span>{latestApplication.paymentReference || 'Not captured'}</span>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <strong>Submitted</strong>
                          <span>
                            {latestApplication.submittedAt
                              ? new Date(latestApplication.submittedAt).toLocaleString()
                              : 'Unknown'}
                          </span>
                        </Grid>
                      </Grid>

                      {latestApplication.comments && (
                        <Typography variant="body2" color="text.secondary">
                          {latestApplication.comments}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      This resident has not submitted a hostel application yet.
                    </Typography>
                  )}
                </div>
              </Stack>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a resident from the directory to inspect their record.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResidentDetailsDialog;
